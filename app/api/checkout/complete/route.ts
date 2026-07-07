import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createInvoiceNumber } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import type { InvoicePrintData } from "@/lib/invoice-data";

const completeSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    variantName: z.string().optional(),
  })).min(1),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_WALLET", "OTHER"]).default("CASH"),
  invoiceFormat: z.enum(["RECEIPT", "A4"]).default("RECEIPT"),
  discountAmount: z.coerce.number().min(0).default(0),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = completeSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload", issues: parsed.error.issues }, { status: 400 });
  }

  const businessId = session.user.businessId;
  const productIds = Array.from(new Set(parsed.data.items.map((i) => i.productId)));
  const quantities = parsed.data.items.reduce((acc, i) => {
    acc.set(i.productId, (acc.get(i.productId) || 0) + i.quantity);
    return acc;
  }, new Map<string, number>());

  let store = await prisma.store.findFirst({
    where: { businessId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!store) {
    const existingMainStore = await prisma.store.findUnique({
      where: { businessId_code: { businessId, code: "MAIN" } },
    });

    store = existingMainStore
      ? await prisma.store.update({
          where: { id: existingMainStore.id },
          data: { isActive: true },
        })
      : await prisma.store.create({
          data: {
            businessId,
            name: "Main Store",
            code: "MAIN",
          },
        });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.businessSettings.findUnique({ where: { businessId } });
      const inventory = await tx.inventory.findMany({
        where: { businessId, storeId: store.id, productId: { in: productIds } },
        include: { product: true },
      });

      if (inventory.length !== productIds.length) {
        throw new Error("Some products are not available in this store.");
      }

      let subtotal = 0;
      const invMap = new Map(inventory.map((r) => [r.productId, r]));
      const saleItems: Array<{
        inventoryId: string; productId: string; productVariantId?: string; variantName?: string;
        productNameSnapshot: string; skuSnapshot: string; quantity: number; unitPrice: number;
        previousQuantity: number; newQuantity: number; taxAmount: number; lineTotal: number;
      }> = [];

      for (const itemDef of parsed.data.items) {
        const row = invMap.get(itemDef.productId);
        if (!row) throw new Error(`Product ${itemDef.productId} not available in this store.`);
        if (!row.product.isActive) throw new Error(`${row.product.name} is deactivated.`);
        if (row.quantity < itemDef.quantity) throw new Error(`${row.product.name} has only ${row.quantity} in stock.`);

        let unitPrice = Number(row.product.price);
        let variantId: string | undefined;
        if (itemDef.variantName) {
          const variant = await tx.productVariant.findUnique({
            where: { productId_name: { productId: itemDef.productId, name: itemDef.variantName } },
          });
          if (!variant) throw new Error(`Variant "${itemDef.variantName}" not found for ${row.product.name}`);
          unitPrice += Number(variant.priceAdj);
          variantId = variant.id;
        }

        const lineTotal = unitPrice * itemDef.quantity;
        subtotal += lineTotal;

        saleItems.push({
          inventoryId: row.id,
          productId: row.productId,
          productVariantId: variantId,
          variantName: itemDef.variantName,
          productNameSnapshot: row.product.name,
          skuSnapshot: row.product.sku,
          quantity: itemDef.quantity,
          unitPrice,
          previousQuantity: row.quantity,
          newQuantity: row.quantity - itemDef.quantity,
          taxAmount: 0,
          lineTotal,
        });
      }

      const discountAmount = Math.min(parsed.data.discountAmount, subtotal);
      const taxEnabled = settings?.taxEnabled ?? false;
      const taxRate = settings?.taxRate ? Number(settings.taxRate) : 0;
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = taxEnabled ? Math.round(taxableAmount * (taxRate / 100)) : 0;
      const totalAmount = taxableAmount + taxAmount;
      const invoiceNumber = createInvoiceNumber();

      const sale = await tx.sale.create({
        data: {
          businessId,
          storeId: store.id,
          cashierId: session.user.id,
          invoiceNumber,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          currencyCode: settings?.currencyCode || "PKR",
          currencySymbol: settings?.currencySymbol || "Rs",
          paymentMethod: parsed.data.paymentMethod,
          items: {
            create: saleItems.map((item) => ({
              productId: item.productId,
              productVariantId: item.productVariantId,
              variantName: item.variantName,
              productNameSnapshot: item.productNameSnapshot,
              skuSnapshot: item.skuSnapshot,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
            })),
          },
        },
      });

      const invDeductions = new Map<string, { row: typeof inventory[0]; qty: number }>();
      for (const item of saleItems) {
        const existing = invDeductions.get(item.productId);
        if (existing) {
          existing.qty += item.quantity;
        } else {
          invDeductions.set(item.productId, { row: invMap.get(item.productId)!, qty: item.quantity });
        }
      }

      for (const [, ded] of invDeductions) {
        const newQty = ded.row.quantity - ded.qty;
        await tx.inventory.update({
          where: { id: ded.row.id },
          data: { quantity: newQty },
        });
        await tx.stockMovement.create({
          data: {
            businessId,
            storeId: store.id,
            productId: ded.row.productId,
            type: "SALE",
            quantity: ded.qty,
            previousQuantity: ded.row.quantity,
            newQuantity: newQty,
            reason: `Sale ${invoiceNumber}`,
            createdById: session.user.id,
            saleId: sale.id,
          },
        });
      }

      const invoice = await tx.invoice.create({
        data: {
          businessId,
          storeId: store.id,
          saleId: sale.id,
          invoiceNumber,
          format: parsed.data.invoiceFormat,
        },
      });

      return { saleId: sale.id, invoiceId: invoice.id, invoiceNumber };
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { settings: true, stores: { where: { id: store.id } } },
    });
    const sale = await prisma.sale.findUnique({
      where: { id: result.saleId },
      include: { cashier: true, items: true },
    });
    if (!business || !sale) throw new Error("Could not load invoice data");

    const invoiceData: InvoicePrintData = {
      businessName: business.name,
      businessPhone: business.phone,
      businessAddress: business.address,
      logoUrl: business.logoUrl,
      storeName: store.name,
      storeAddress: store.address,
      invoiceNumber: result.invoiceNumber,
      invoiceId: result.invoiceId,
      createdAt: sale.createdAt,
      cashierName: sale.cashier.name || sale.cashier.email || "Cashier",
      paymentMethod: sale.paymentMethod,
      currencyCode: sale.currencyCode,
      currencySymbol: sale.currencySymbol,
      currencyLocale: business.settings?.currencyLocale || "en-PK",
      footer: business.settings?.invoiceFooter || "Thank you for shopping with us.",
      subtotal: Number(sale.subtotal),
      discountAmount: Number(sale.discountAmount),
      taxAmount: Number(sale.taxAmount),
      totalAmount: Number(sale.totalAmount),
      items: sale.items.map((item) => ({
        name: item.variantName ? `${item.productNameSnapshot} (${item.variantName})` : item.productNameSnapshot,
        sku: item.skuSnapshot,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
      })),
    };

    await logAudit({
      businessId,
      userId: session.user.id,
      action: "SALE_COMPLETED",
      entityType: "Sale",
      entityId: result.saleId,
      metadata: { invoiceNumber: result.invoiceNumber, totalAmount: invoiceData.totalAmount, paymentMethod: parsed.data.paymentMethod },
    });

    return NextResponse.json({ ...result, invoiceData });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete sale" }, { status: 400 });
  }
}

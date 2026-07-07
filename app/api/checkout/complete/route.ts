import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createInvoiceNumber } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

const completeSaleSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().positive() })).min(1),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_WALLET", "OTHER"]).default("CASH"),
  invoiceFormat: z.enum(["RECEIPT", "A4"]).default("RECEIPT"),
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
  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }
  const productIds = Array.from(quantities.keys());

  const store = await prisma.store.findFirst({
    where: { businessId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!store) {
    return NextResponse.json({ error: "No active store found" }, { status: 400 });
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
      const saleItems = inventory.map((row) => {
        const quantity = quantities.get(row.productId) || 0;
        if (!row.product.isActive) throw new Error(`${row.product.name} is deactivated.`);
        if (row.quantity < quantity) throw new Error(`${row.product.name} has only ${row.quantity} in stock.`);

        const unitPrice = Number(row.product.price);
        const lineTotal = unitPrice * quantity;
        subtotal += lineTotal;

        return {
          inventoryId: row.id,
          productId: row.productId,
          productNameSnapshot: row.product.name,
          skuSnapshot: row.product.sku,
          quantity,
          unitPrice,
          previousQuantity: row.quantity,
          newQuantity: row.quantity - quantity,
          taxAmount: 0,
          lineTotal,
        };
      });

      const discountAmount = subtotal > 1000 ? 100 : 0;
      const taxableAmount = Math.max(0, subtotal - discountAmount);
      const taxAmount = Math.round(taxableAmount * 0.05);
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

      for (const item of saleItems) {
        await tx.inventory.update({
          where: { id: item.inventoryId },
          data: { quantity: item.newQuantity },
        });
        await tx.stockMovement.create({
          data: {
            businessId,
            storeId: store.id,
            productId: item.productId,
            type: "SALE",
            quantity: item.quantity,
            previousQuantity: item.previousQuantity,
            newQuantity: item.newQuantity,
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

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not complete sale" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  barcode: z.string().optional(),
  categoryName: z.string().optional(),
  price: z.coerce.number().positive(),
  initialQuantity: z.coerce.number().int().min(0).default(0),
  reorderLevel: z.coerce.number().int().min(0).default(5),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId || !session.user.id || session.user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    barcode: formData.get("barcode") || undefined,
    categoryName: formData.get("categoryName") || undefined,
    price: formData.get("price"),
    initialQuantity: formData.get("initialQuantity") || 0,
    reorderLevel: formData.get("reorderLevel") || 5,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const businessId = session.user.businessId;
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

  const existing = await prisma.product.findUnique({
    where: { businessId_sku: { businessId, sku: parsed.data.sku } },
  });

  if (existing) {
    return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
  }

  let productId!: string;

  await prisma.$transaction(async (tx) => {
    const categoryName = parsed.data.categoryName?.trim();
    const category = categoryName
      ? await tx.category.upsert({
          where: { businessId_name: { businessId, name: categoryName } },
          update: { isActive: true },
          create: { businessId, name: categoryName },
        })
      : null;

    const product = await tx.product.create({
      data: {
        businessId,
        categoryId: category?.id,
        name: parsed.data.name,
        sku: parsed.data.sku,
        barcode: parsed.data.barcode || null,
        price: parsed.data.price,
      },
    });
    productId = product.id;

    await tx.inventory.create({
      data: {
        businessId,
        storeId: store.id,
        productId: product.id,
        quantity: parsed.data.initialQuantity,
        reorderLevel: parsed.data.reorderLevel,
      },
    });

    if (parsed.data.initialQuantity > 0) {
      await tx.stockMovement.create({
        data: {
          businessId,
          storeId: store.id,
          productId: product.id,
          type: "STOCK_IN",
          quantity: parsed.data.initialQuantity,
          previousQuantity: 0,
          newQuantity: parsed.data.initialQuantity,
          reason: "Initial product stock",
          createdById: session.user.id,
        },
      });
    }
  });

  return NextResponse.json({ productId, name: parsed.data.name, sku: parsed.data.sku, barcode: parsed.data.barcode || null });
}

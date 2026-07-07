import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, businessId: session.user.businessId },
    include: {
      category: true,
      variants: { orderBy: { sortOrder: "asc" } },
      inventory: { include: { store: true } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.businessId || session.user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const product = await prisma.product.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.barcode !== undefined) updateData.barcode = body.barcode || null;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.description !== undefined) updateData.description = body.description || null;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.isVisionEnabled !== undefined) updateData.isVisionEnabled = body.isVisionEnabled;

  if (body.sku !== undefined && body.sku !== product.sku) {
    const skuExists = await prisma.product.findUnique({
      where: { businessId_sku: { businessId: session.user.businessId, sku: body.sku } },
    });
    if (skuExists) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 409 });
    }
    updateData.sku = body.sku;
  }

  if (body.categoryName !== undefined) {
    const categoryName = body.categoryName?.trim();
    const category = categoryName
      ? await prisma.category.upsert({
          where: { businessId_name: { businessId: session.user.businessId, name: categoryName } },
          update: { isActive: true },
          create: { businessId: session.user.businessId, name: categoryName },
        })
      : null;
    updateData.categoryId = category?.id ?? null;
  }

  if (body.variants !== undefined) {
    await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });

      for (let i = 0; i < body.variants.length; i++) {
        const v = body.variants[i];
        await tx.productVariant.create({
          data: {
            productId: id,
            name: v.name,
            priceAdj: v.priceAdj ?? 0,
            sku: v.sku || null,
            barcode: v.barcode || null,
            sortOrder: i,
            isActive: v.isActive ?? true,
          },
        });
      }
    });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

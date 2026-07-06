import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncProductsToAgent } from "@/lib/vision-agent";

export async function POST() {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { businessId: session.user.businessId, isActive: true },
    select: { id: true, name: true, sku: true, barcode: true, price: true, isActive: true },
  });

  if (products.length === 0) {
    return NextResponse.json({ synced: 0, product_ids: [] });
  }

  const result = await syncProductsToAgent(
    products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      price: Number(p.price),
      is_active: p.isActive,
    })),
  );

  return NextResponse.json(result);
}

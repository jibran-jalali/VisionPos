import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profiles = await prisma.productVisualProfile.findMany({
    where: { businessId: session.user.businessId, profileStatus: "READY" },
    select: { productId: true, embeddings: true, product: { select: { name: true, sku: true, barcode: true } } },
  });

  const mapped = profiles
    .filter((p) => p.embeddings !== null)
    .map((p) => ({
      productId: p.productId,
      productName: p.product.name,
      sku: p.product.sku,
      barcode: p.product.barcode,
      embeddings: p.embeddings as number[][],
    }));

  return NextResponse.json({ profiles: mapped });
}

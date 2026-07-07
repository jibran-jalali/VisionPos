import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId || session.user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const productId = formData.get("productId") as string;

  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, businessId: session.user.businessId },
  });

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { productId } });
    await tx.inventory.deleteMany({ where: { productId } });
    await tx.productVisualProfile.deleteMany({ where: { productId } });
    await tx.saleItem.deleteMany({ where: { productId } });
    await tx.product.delete({ where: { id: productId } });
  });

  return NextResponse.json({ success: true });
}

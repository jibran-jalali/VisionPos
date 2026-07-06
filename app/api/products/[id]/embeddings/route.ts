import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { embeddings, frameCount, embeddingModel } = body;

  if (!Array.isArray(embeddings)) {
    return NextResponse.json({ error: "embeddings must be an array" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id, businessId: session.user.businessId },
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const profile = await prisma.productVisualProfile.upsert({
    where: { productId: id },
    update: {
      embeddings: embeddings,
      frameCount: frameCount ?? embeddings.length,
      embeddingModel: embeddingModel ?? "hsv_histogram_v1",
      profileStatus: "READY",
    },
    create: {
      businessId: session.user.businessId,
      productId: id,
      embeddings: embeddings,
      frameCount: frameCount ?? embeddings.length,
      embeddingModel: embeddingModel ?? "hsv_histogram_v1",
      profileStatus: "READY",
    },
  });

  await prisma.product.update({
    where: { id },
    data: { isVisionEnabled: true },
  });

  return NextResponse.json({ productId: id, profileStatus: profile.profileStatus });
}

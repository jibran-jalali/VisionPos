import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  frameCount: z.number().int().min(0),
  embeddingModel: z.string().min(1),
  profileStatus: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.businessId || session.user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = profileSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.productVisualProfile.upsert({
    where: { productId: id },
    update: {
      frameCount: parsed.data.frameCount,
      embeddingModel: parsed.data.embeddingModel,
      profileStatus: parsed.data.profileStatus === "READY" ? "READY" : "FAILED",
    },
    create: {
      businessId: session.user.businessId,
      productId: id,
      frameCount: parsed.data.frameCount,
      embeddingModel: parsed.data.embeddingModel,
      profileStatus: parsed.data.profileStatus === "READY" ? "READY" : "FAILED",
    },
  });

  await prisma.product.update({
    where: { id },
    data: { isVisionEnabled: parsed.data.profileStatus === "READY" },
  });

  return NextResponse.json({ ok: true });
}

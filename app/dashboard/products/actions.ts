"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productIdSchema = z.object({
  productId: z.string().min(1),
});

export async function toggleProductActiveAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.businessId || !session.user.id || session.user.role === "CASHIER") {
    redirect("/login");
  }

  const parsed = productIdSchema.safeParse({
    productId: formData.get("productId"),
  });

  if (!parsed.success) {
    redirect("/dashboard/products?error=invalid");
  }

  const businessId = session.user.businessId;

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, businessId },
    select: { isActive: true },
  });

  if (!product) {
    redirect("/dashboard/products?error=notfound");
  }

  await prisma.product.update({
    where: { id: parsed.data.productId },
    data: { isActive: !product.isActive },
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/products");
}

export async function deleteProductAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.businessId || !session.user.id || session.user.role === "CASHIER") {
    redirect("/login");
  }

  const parsed = productIdSchema.safeParse({
    productId: formData.get("productId"),
  });

  if (!parsed.success) {
    redirect("/dashboard/products?error=invalid");
  }

  const businessId = session.user.businessId;

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, businessId },
  });

  if (!product) {
    redirect("/dashboard/products?error=notfound");
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { productId: parsed.data.productId } });
    await tx.inventory.deleteMany({ where: { productId: parsed.data.productId } });
    await tx.productVisualProfile.deleteMany({ where: { productId: parsed.data.productId } });
    await tx.saleItem.deleteMany({ where: { productId: parsed.data.productId } });
    await tx.product.delete({ where: { id: parsed.data.productId } });
  });

  revalidatePath("/dashboard/products");
  revalidatePath("/dashboard/inventory");
  redirect("/dashboard/products");
}

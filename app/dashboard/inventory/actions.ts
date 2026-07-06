"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const restockSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  reason: z.string().optional(),
});

export async function restockProductAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.businessId || !session.user.id || session.user.role === "CASHIER") {
    redirect("/login");
  }

  const parsed = restockSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    redirect("/dashboard/inventory?error=invalid");
  }

  const businessId = session.user.businessId;
  const inventory = await prisma.inventory.findFirst({
    where: {
      businessId,
      productId: parsed.data.productId,
    },
  });

  if (!inventory) {
    redirect("/dashboard/inventory?error=inventory");
  }

  const previousQuantity = inventory.quantity;
  const newQuantity = previousQuantity + parsed.data.quantity;

  await prisma.$transaction(async (tx) => {
    await tx.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity },
    });

    await tx.stockMovement.create({
      data: {
        businessId,
        storeId: inventory.storeId,
        productId: inventory.productId,
        type: "STOCK_IN",
        quantity: parsed.data.quantity,
        previousQuantity,
        newQuantity,
        reason: parsed.data.reason || "Restock",
        createdById: session.user.id,
      },
    });
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/products");
  redirect("/dashboard/inventory?restocked=1");
}

"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createCashierSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function createCashierAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.businessId || session.user.role === "CASHIER") {
    redirect("/login");
  }

  const parsed = createCashierSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/dashboard/users?error=invalid");
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    redirect("/dashboard/users?error=exists");
  }

  const store = await prisma.store.findFirst({
    where: {
      businessId: session.user.businessId,
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!store) {
    redirect("/dashboard/users?error=store");
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "CASHIER",
        businessId: session.user.businessId,
      },
    });

    await tx.storeUser.create({
      data: {
        businessId: session.user.businessId!,
        storeId: store.id,
        userId: user.id,
        role: "CASHIER",
      },
    });
  });

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users?created=1");
}

"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2),
  businessName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "business";
}

async function uniqueBusinessSlug(name: string) {
  const baseSlug = createSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
}

export async function registerOwnerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid");
  }

  const email = parsed.data.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    redirect("/register?error=exists");
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const businessSlug = await uniqueBusinessSlug(parsed.data.businessName);

  await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: parsed.data.businessName,
        slug: businessSlug,
        email,
        settings: {
          create: {
            currencyCode: "PKR",
            currencySymbol: "Rs",
            currencyLocale: "en-PK",
            defaultInvoiceFormat: "RECEIPT",
          },
        },
      },
    });

    const store = await tx.store.create({
      data: {
        businessId: business.id,
        name: "Main Store",
        code: "MAIN",
      },
    });

    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        role: "OWNER",
        businessId: business.id,
      },
    });

    await tx.storeUser.create({
      data: {
        businessId: business.id,
        storeId: store.id,
        userId: user.id,
        role: "OWNER",
      },
    });
  });

  redirect("/login?registered=1");
}

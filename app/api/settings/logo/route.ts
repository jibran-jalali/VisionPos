import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const logoSchema = z.object({
  logoUrl: z.string().max(900_000).nullable(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId || session.user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = logoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid logo payload" }, { status: 400 });
  }

  if (parsed.data.logoUrl && !parsed.data.logoUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "Logo must be an image" }, { status: 400 });
  }

  await prisma.business.update({
    where: { id: session.user.businessId },
    data: { logoUrl: parsed.data.logoUrl },
  });

  return NextResponse.json({ ok: true });
}

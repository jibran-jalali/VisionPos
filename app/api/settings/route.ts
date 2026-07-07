import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  visionEnabled: z.boolean().optional(),
  autoPrint: z.boolean().optional(),
  taxEnabled: z.boolean().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  defaultInvoiceFormat: z.enum(["RECEIPT", "A4"]).optional(),
  invoiceFooter: z.string().max(500).optional(),
  currencyCode: z.string().min(2).max(5).optional(),
  currencySymbol: z.string().min(1).max(5).optional(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.businessId || session.user.role === "CASHIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings", issues: parsed.error.issues }, { status: 400 });
  }

  const businessId = session.user.businessId;

  const existing = await prisma.businessSettings.findUnique({ where: { businessId } });

  if (existing) {
    await prisma.businessSettings.update({ where: { businessId }, data: parsed.data });
  } else {
    await prisma.businessSettings.create({ data: { businessId, ...parsed.data } });
  }

  return NextResponse.json({ ok: true });
}

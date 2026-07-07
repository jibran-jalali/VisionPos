import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const user = await prisma.user.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.email !== undefined) updateData.email = body.email.toLowerCase();
  if (body.role !== undefined) {
    if (user.role === "OWNER") {
      return NextResponse.json({ error: "Cannot change OWNER role" }, { status: 400 });
    }
    updateData.role = body.role;
  }
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, businessId: session.user.businessId },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (user.role === "OWNER") {
    return NextResponse.json({ error: "Cannot deactivate OWNER" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json(updated);
}

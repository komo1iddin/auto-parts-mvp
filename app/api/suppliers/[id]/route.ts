import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }
  const { id } = await params;
  const { name, phone, wechat, note } = await req.json();
  const supplier = await prisma.supplier.update({
    where: { id },
    data: { name: name.trim(), phone: phone || null, wechat: wechat || null, note: note || null },
  });
  revalidateAppData("suppliers", "parts");
  return Response.json({ supplier });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }
  const { id } = await params;
  await prisma.supplier.delete({ where: { id } });
  revalidateAppData("suppliers", "parts");
  return Response.json({ ok: true });
}

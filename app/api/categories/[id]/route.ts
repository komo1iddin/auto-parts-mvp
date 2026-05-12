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
  const { name, parentId } = await req.json();
  const category = await prisma.category.update({
    where: { id },
    data: { name: name.trim(), parentId: parentId || null },
  });
  revalidateAppData("categories", "parts");
  return Response.json({ category });
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
  await prisma.category.delete({ where: { id } });
  revalidateAppData("categories", "parts");
  return Response.json({ ok: true });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAuthUser, forbidden } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  const isAdmin = user?.role === "admin";

  const part = await prisma.part.findUnique({
    where: { id },
    include: { category: true, supplier: true },
  });

  if (!part) return Response.json({ error: "Topilmadi" }, { status: 404 });

  return Response.json({
    part: {
      ...part,
      purchasePriceCny: isAdmin ? part.purchasePriceCny : undefined,
      wholesalePriceCny: isAdmin ? part.wholesalePriceCny : undefined,
      supplier: isAdmin ? part.supplier : undefined,
      note: isAdmin ? part.note : undefined,
    },
  });
}

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
  const body = await req.json();
  const {
    code, name, categoryId, brand, type,
    purchasePriceCny, wholesalePriceCny, sellingPriceCny,
    supplierId, imageUrl, note,
  } = body;

  try {
    const part = await prisma.part.update({
      where: { id },
      data: {
        code: code?.trim(),
        name: name?.trim() || null,
        categoryId: categoryId || null,
        brand: brand?.trim() || null,
        type: type || "original",
        purchasePriceCny: purchasePriceCny != null ? Number(purchasePriceCny) : null,
        wholesalePriceCny: wholesalePriceCny != null ? Number(wholesalePriceCny) : null,
        sellingPriceCny: sellingPriceCny != null ? Number(sellingPriceCny) : null,
        supplierId: supplierId || null,
        imageUrl: imageUrl || null,
        note: note?.trim() || null,
      },
      include: { category: true, supplier: true },
    });
    revalidateAppData("parts");
    return Response.json({ part });
  } catch {
    return Response.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
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
  await prisma.part.delete({ where: { id } });
  revalidateAppData("parts");
  return Response.json({ ok: true });
}

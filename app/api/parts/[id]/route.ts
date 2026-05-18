import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAuthUser, forbidden } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "";
}

function isUniqueConflict(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return message.includes("unique constraint") || message.includes("duplicate key");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  const isAdmin = user?.role === "admin";

  const part = await prisma.partVariant.findUnique({
    where: { id },
    include: { part: { include: { category: true } }, supplier: true },
  });

  if (!part) return Response.json({ error: "Topilmadi" }, { status: 404 });

  return Response.json({
    part: {
      ...part,
      code: part.part.code,
      name: part.part.name,
      categoryId: part.part.categoryId,
      category: part.part.category,
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

  if (!code?.trim()) return Response.json({ error: "Qism kodi majburiy" }, { status: 400 });

  try {
    const part = await prisma.$transaction(async (tx) => {
      const existing = await tx.partVariant.findUnique({ where: { id } });
      if (!existing) throw new Error("Topilmadi");

      const family = await tx.part.upsert({
        where: { code: code?.trim() || "" },
        update: {
          name: name?.trim() || null,
          categoryId: categoryId || null,
        },
        create: {
          code: code?.trim() || "",
          name: name?.trim() || null,
          categoryId: categoryId || null,
        },
      });

      return tx.partVariant.update({
        where: { id },
        data: {
          partId: family.id,
          brand: brand?.trim() || null,
          type: type || "original",
          purchasePriceCny: purchasePriceCny != null ? Number(purchasePriceCny) : null,
          wholesalePriceCny: wholesalePriceCny != null ? Number(wholesalePriceCny) : null,
          sellingPriceCny: sellingPriceCny != null ? Number(sellingPriceCny) : null,
          supplierId: supplierId || null,
          imageUrl: imageUrl || null,
          note: note?.trim() || null,
        },
        include: { part: { include: { category: true } }, supplier: true },
      });
    });
    revalidateAppData("parts");
    return Response.json({ part });
  } catch (error) {
    if (errorMessage(error) === "Topilmadi") {
      return Response.json({ error: "Topilmadi" }, { status: 404 });
    }
    if (isUniqueConflict(error)) {
      return Response.json({ error: "Bu part number uchun bunday variant allaqachon mavjud" }, { status: 409 });
    }
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
  await prisma.partVariant.delete({ where: { id } });
  revalidateAppData("parts");
  return Response.json({ ok: true });
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getAuthUser, forbidden } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { buildSupplierPricesFromBody, replaceVariantSupplierPrices } from "@/lib/part-supplier-prices";

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
    include: {
      part: { include: { category: true } },
      supplierPrices: { include: { supplier: true }, orderBy: [{ purchasePriceCny: "asc" }, { createdAt: "asc" }] },
    },
  });

  if (!part) return Response.json({ error: "Topilmadi" }, { status: 404 });
  const bestSupplierPrice = part.supplierPrices?.[0] ?? null;

  return Response.json({
    part: {
      ...part,
      code: part.part.code,
      name: part.part.name,
      categoryId: part.part.categoryId,
      category: part.part.category,
      bestSupplierPrice: isAdmin ? bestSupplierPrice : undefined,
      purchasePriceCny: isAdmin ? bestSupplierPrice?.purchasePriceCny : undefined,
      wholesalePriceCny: isAdmin ? bestSupplierPrice?.wholesalePriceCny : undefined,
      supplier: isAdmin ? bestSupplierPrice?.supplier : undefined,
      supplierPrices: isAdmin ? part.supplierPrices : undefined,
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
    sellingPriceCny,
    imageUrl, note,
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

      const duplicate = (await tx.partVariant.findMany({ where: { partId: family.id, type: type || "original" } }))
        .find((variant: { id: string; brand?: string | null }) => variant.id !== id && (variant.brand ?? "") === (brand?.trim() || ""));
      if (duplicate) throw new Error("Unique constraint");

      await tx.partVariant.update({
        where: { id },
        data: {
          partId: family.id,
          brand: brand?.trim() || null,
          type: type || "original",
          sellingPriceCny: sellingPriceCny != null ? Number(sellingPriceCny) : null,
          imageUrl: imageUrl || null,
          note: note?.trim() || null,
        },
        include: { part: { include: { category: true } } },
      });

      return replaceVariantSupplierPrices(id, buildSupplierPricesFromBody(body));
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

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized, getAuthUser, hasAuthSessionCookie } from "@/lib/auth";
import { getPartsList, revalidateAppData } from "@/lib/data";
import { buildSupplierPricesFromBody, replaceVariantSupplierPrices } from "@/lib/part-supplier-prices";

export async function GET(req: NextRequest) {
  const user = (await hasAuthSessionCookie()) ? await getAuthUser() : null;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const categoryId = searchParams.get("categoryId");
  const supplierId = searchParams.get("supplierId");
  const brand = searchParams.get("brand");
  const take = Math.min(Number(searchParams.get("take") ?? "50"), 200);
  const skip = Number(searchParams.get("skip") ?? "0");

  const result = await getPartsList(
    user?.role ?? "client",
    q,
    categoryId ?? "",
    supplierId ?? "",
    brand ?? "",
    take,
    skip
  );
  return Response.json(result);
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const user = await getAuthUser();
  if (user?.role !== "admin") {
    return Response.json({ error: "Faqat admin qo'sha oladi" }, { status: 403 });
  }

  const body = await req.json();
  const {
    code, name, categoryId, brand, type,
    sellingPriceCny,
    imageUrl, note,
  } = body;

  if (!code) return Response.json({ error: "Qism kodi majburiy" }, { status: 400 });

  try {
    const part = await prisma.$transaction(async (tx) => {
      let family = await tx.part.findUnique({ where: { code: code.trim() } });
      if (!family) {
        family = await tx.part.create({
          data: {
            code: code.trim(),
            name: name?.trim() || null,
            categoryId: categoryId || null,
          },
        });
      }

      const duplicate = (await tx.partVariant.findMany({ where: { partId: family.id, type: type || "original" } }))
        .find((variant: { brand?: string | null }) => (variant.brand ?? "") === (brand?.trim() || ""));
      if (duplicate) throw new Error("Unique constraint");

      const variant = await tx.partVariant.create({
        data: {
          partId: family.id,
          brand: brand?.trim() || null,
          type: type || "original",
          sellingPriceCny: sellingPriceCny ? Number(sellingPriceCny) : null,
          imageUrl: imageUrl || null,
          note: note?.trim() || null,
        },
        include: { part: { include: { category: true } } },
      });

      return replaceVariantSupplierPrices(variant.id, buildSupplierPricesFromBody(body));
    });
    revalidateAppData("parts");
    return Response.json({ part }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return Response.json({ error: "Bu part number uchun bunday variant allaqachon mavjud" }, { status: 409 });
    }
    return Response.json({ error: "Xatolik yuz berdi" }, { status: 500 });
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized, getAuthUser, hasAuthSessionCookie } from "@/lib/auth";
import { getPartsList, revalidateAppData } from "@/lib/data";

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
    purchasePriceCny, wholesalePriceCny, sellingPriceCny,
    supplierId, imageUrl, note,
  } = body;

  if (!code) return Response.json({ error: "Qism kodi majburiy" }, { status: 400 });

  try {
    const part = await prisma.$transaction(async (tx) => {
      const family = await tx.part.upsert({
        where: { code: code.trim() },
        update: {
          name: name?.trim() || undefined,
          categoryId: categoryId || undefined,
        },
        create: {
          code: code.trim(),
          name: name?.trim() || null,
          categoryId: categoryId || null,
        },
      });

      return tx.partVariant.create({
        data: {
          partId: family.id,
          brand: brand?.trim() || null,
          type: type || "original",
          purchasePriceCny: purchasePriceCny ? Number(purchasePriceCny) : null,
          wholesalePriceCny: wholesalePriceCny ? Number(wholesalePriceCny) : null,
          sellingPriceCny: sellingPriceCny ? Number(sellingPriceCny) : null,
          supplierId: supplierId || null,
          imageUrl: imageUrl || null,
          note: note?.trim() || null,
        },
        include: { part: { include: { category: true } }, supplier: true },
      });
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

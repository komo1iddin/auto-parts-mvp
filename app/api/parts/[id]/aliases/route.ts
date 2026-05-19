import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, forbidden } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { normalizePartCodeAlias } from "@/lib/part-code-normalization";

function sameBrand(left?: string | null, right?: string | null) {
  return (left ?? "").trim().toLowerCase() === (right ?? "").trim().toLowerCase();
}

async function moveOrderItems(where: Record<string, string>, data: Record<string, string | null>) {
  const items = await prisma.orderItem.findMany({ where });
  for (const item of items) {
    await prisma.orderItem.update({ where: { id: item.id }, data });
  }
}

async function mergePartIntoTarget(sourcePartId: string, targetPartId: string) {
  const targetVariants = await prisma.partVariant.findMany({ where: { partId: targetPartId } });
  const sourceVariants = await prisma.partVariant.findMany({
    where: { partId: sourcePartId },
    include: { supplierPrices: true },
  });

  for (const sourceVariant of sourceVariants) {
    const targetVariant = targetVariants.find((variant: { type: string; brand?: string | null }) => (
      variant.type === sourceVariant.type && sameBrand(variant.brand, sourceVariant.brand)
    ));

    if (targetVariant) {
      await moveOrderItems(
        { partVariantId: sourceVariant.id },
        { partId: targetPartId, partVariantId: targetVariant.id }
      );

      const targetPrices = await prisma.partSupplierPrice.findMany({ where: { partVariantId: targetVariant.id } });
      for (const sourcePrice of sourceVariant.supplierPrices ?? []) {
        const targetPrice = targetPrices.find((price: { supplierId: string }) => price.supplierId === sourcePrice.supplierId);
        if (targetPrice) {
          await moveOrderItems(
            { partSupplierPriceId: sourcePrice.id },
            { partSupplierPriceId: targetPrice.id }
          );
        } else {
          await prisma.partSupplierPrice.update({
            where: { id: sourcePrice.id },
            data: { partVariantId: targetVariant.id },
          });
        }
      }

      await prisma.partVariant.delete({ where: { id: sourceVariant.id } });
    } else {
      await prisma.partVariant.update({
        where: { id: sourceVariant.id },
        data: { partId: targetPartId },
      });
      await moveOrderItems(
        { partVariantId: sourceVariant.id },
        { partId: targetPartId }
      );
    }
  }

  await moveOrderItems({ partId: sourcePartId }, { partId: targetPartId });

  const aliases = await prisma.partCodeAlias.findMany({ where: { partId: sourcePartId } });
  for (const alias of aliases) {
    await prisma.partCodeAlias.update({ where: { id: alias.id }, data: { partId: targetPartId } });
  }

  await prisma.part.delete({ where: { id: sourcePartId } });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return forbidden();
  }

  const { id } = await params;
  const targetVariant = await prisma.partVariant.findUnique({ where: { id }, include: { part: true } });
  if (!targetVariant?.part) return Response.json({ error: "Topilmadi" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? "").trim();
  const mergeExisting = Boolean(body.mergeExisting);
  if (!code) return Response.json({ error: "Alias kod majburiy" }, { status: 400 });

  const normalizedCode = normalizePartCodeAlias(code);
  if (!normalizedCode) return Response.json({ error: "Alias kod noto'g'ri" }, { status: 400 });

  const existingPart = await prisma.part.findUnique({ where: { code } });
  if (existingPart && existingPart.id !== targetVariant.partId) {
    if (!mergeExisting) {
      return Response.json({
        error: "Bu kod alohida zapchast sifatida mavjud",
        duplicatePart: {
          id: existingPart.id,
          code: existingPart.code,
          name: existingPart.name,
        },
        suggestedAction: "Agar bu bitta zapchast bo'lsa, ularni alias orqali birlashtiring.",
      }, { status: 409 });
    }

    await mergePartIntoTarget(existingPart.id, targetVariant.partId);
  }

  const existingAlias = await prisma.partCodeAlias.findUnique({ where: { normalizedCode } });
  if (existingAlias && existingAlias.partId !== targetVariant.partId) {
    return Response.json({ error: "Bu alias boshqa zapchastga bog'langan" }, { status: 409 });
  }

  if (!existingAlias && targetVariant.part.code !== code) {
    await prisma.partCodeAlias.create({
      data: {
        partId: targetVariant.partId,
        code,
        normalizedCode,
      },
    });
  }

  revalidateAppData("parts");
  return Response.json({ ok: true });
}

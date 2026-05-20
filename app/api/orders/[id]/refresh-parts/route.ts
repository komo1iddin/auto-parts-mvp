import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, forbidden } from "@/lib/auth";

interface RefreshItemInput {
  itemId: string;
  partVariantId: string;
  supplierId: string;
}

interface VariantRow {
  id: string;
  brand: string | null;
  type: string;
  sellingPriceCny: unknown;
  part: { name: string | null; category: { name: string } | null };
  supplierPrices: Array<{
    supplierId: string;
    purchasePriceCny: unknown;
    wholesalePriceCny: unknown;
  }>;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user || user.role !== "admin") return forbidden();

  await params;

  const body = (await req.json()) as { items: RefreshItemInput[] };
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return Response.json({ refreshed: [] });
  }

  const partVariantIds = body.items
    .map((item) => item.partVariantId)
    .filter(Boolean);

  const variants = (await prisma.partVariant.findMany({
    where: { id: { in: partVariantIds } },
    include: {
      part: { include: { category: true } },
      supplierPrices: { include: { supplier: true } },
    },
  })) as VariantRow[];

  const variantMap = new Map<string, VariantRow>(
    variants.map((v) => [v.id, v])
  );

  const refreshed = body.items.map((item) => {
    const variant = variantMap.get(item.partVariantId);
    if (!variant) return { itemId: item.itemId, found: false };

    const supplierPrice = variant.supplierPrices.find(
      (sp) => sp.supplierId === item.supplierId
    );

    return {
      itemId: item.itemId,
      found: true,
      latest: {
        partName: variant.part.name ?? "",
        categoryName: variant.part.category?.name ?? "",
        brand: variant.brand ?? "",
        type: variant.type ?? "original",
        sellingPriceCny:
          variant.sellingPriceCny != null ? Number(variant.sellingPriceCny) : null,
        purchasePriceCny: supplierPrice
          ? Number(supplierPrice.purchasePriceCny)
          : null,
        wholesalePriceCny:
          supplierPrice?.wholesalePriceCny != null
            ? Number(supplierPrice.wholesalePriceCny)
            : null,
        supplierFound: Boolean(supplierPrice),
      },
    };
  });

  return Response.json({ refreshed });
}

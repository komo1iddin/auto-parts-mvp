import { prisma } from "@/lib/prisma";

type SupplierPriceInput = {
  id?: string;
  supplierId?: string | null;
  purchasePriceCny?: number | string | null;
  wholesalePriceCny?: number | string | null;
  note?: string | null;
};

function numberOrNull(value: unknown) {
  if (value === "" || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSupplierPrices(prices: SupplierPriceInput[] = []) {
  const bySupplier = new Map<string, SupplierPriceInput>();

  for (const price of prices) {
    const supplierId = price.supplierId?.trim();
    const purchasePriceCny = numberOrNull(price.purchasePriceCny);
    if (!supplierId || purchasePriceCny == null) continue;
    bySupplier.set(supplierId, {
      ...price,
      supplierId,
      purchasePriceCny,
      wholesalePriceCny: numberOrNull(price.wholesalePriceCny),
      note: price.note?.trim() || null,
    });
  }

  return [...bySupplier.values()] as Array<Required<Pick<SupplierPriceInput, "supplierId" | "purchasePriceCny">> & SupplierPriceInput>;
}

export async function replaceVariantSupplierPrices(partVariantId: string, prices: SupplierPriceInput[]) {
  const normalized = normalizeSupplierPrices(prices);
  await prisma.partSupplierPrice.deleteMany({ where: { partVariantId } });

  for (const price of normalized) {
    await prisma.partSupplierPrice.create({
      data: {
        partVariantId,
        supplierId: price.supplierId,
        purchasePriceCny: price.purchasePriceCny,
        wholesalePriceCny: price.wholesalePriceCny ?? null,
        note: price.note ?? null,
      },
    });
  }

  return prisma.partVariant.findUnique({
    where: { id: partVariantId },
    include: {
      part: { include: { category: true } },
      supplierPrices: { include: { supplier: true }, orderBy: [{ purchasePriceCny: "asc" }, { createdAt: "asc" }] },
    },
  });
}

export function buildSupplierPricesFromBody(body: {
  supplierPrices?: SupplierPriceInput[];
  supplierId?: string | null;
  purchasePriceCny?: number | string | null;
  wholesalePriceCny?: number | string | null;
}) {
  if (Array.isArray(body.supplierPrices)) return body.supplierPrices;
  return [
    {
      supplierId: body.supplierId,
      purchasePriceCny: body.purchasePriceCny,
      wholesalePriceCny: body.wholesalePriceCny,
    },
  ];
}

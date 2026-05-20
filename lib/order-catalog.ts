import { prisma } from "@/lib/prisma";
import { revalidateAppData } from "@/lib/data";
import { normalizePartCodeAlias } from "@/lib/part-code-normalization";

type OrderCatalogItem = {
  partId?: string | null;
  partVariantId?: string | null;
  partSupplierPriceId?: string | null;
  partCode: string;
  partName?: string | null;
  categoryName?: string | null;
  brand?: string | null;
  type?: string | null;
  purchasePriceCny?: number | string | null;
  wholesalePriceCny?: number | string | null;
  sellingPriceCny?: number | string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity?: number;
  shippedQuantity?: number | null;
  fulfillmentStatus?: string | null;
  note?: string | null;
};

function textKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function numberOrNull(value: unknown) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameBrand(left?: string | null, right?: string | null) {
  return textKey(left) === textKey(right);
}

async function findFamily(item: OrderCatalogItem) {
  if (item.partId) {
    const byId = await prisma.part.findUnique({ where: { id: item.partId } });
    if (byId) return byId;
  }

  const code = item.partCode.trim();
  const exact = code ? await prisma.part.findUnique({ where: { code } }) : null;
  if (exact) return exact;

  const normalizedCode = normalizePartCodeAlias(code);
  const alias = normalizedCode
    ? await prisma.partCodeAlias.findUnique({ where: { normalizedCode } })
    : null;
  if (alias?.partId) {
    const aliasPart = await prisma.part.findUnique({ where: { id: alias.partId } });
    if (aliasPart) return aliasPart;
  }

  const nameKey = textKey(item.partName || item.partCode);
  if (nameKey) {
    const nameMatches = (await prisma.part.findMany()).filter((part: { name?: string | null }) => textKey(part.name) === nameKey);
    if (nameMatches.length === 1) return nameMatches[0];
  }

  return null;
}

async function findCategoryId(categoryName?: string | null) {
  const key = textKey(categoryName);
  if (!key) return null;
  const categories = await prisma.category.findMany();
  return categories.find((category: { name: string }) => textKey(category.name) === key)?.id ?? null;
}

async function findSupplier(item: OrderCatalogItem) {
  if (item.supplierId) return prisma.supplier.findUnique({ where: { id: item.supplierId } });
  const key = textKey(item.supplierName);
  if (!key) return null;
  const suppliers = await prisma.supplier.findMany();
  return suppliers.find((supplier: { name: string }) => textKey(supplier.name) === key) ?? null;
}

async function findOrCreateVariant(familyId: string, item: OrderCatalogItem) {
  if (item.partVariantId) {
    const byId = await prisma.partVariant.findUnique({ where: { id: item.partVariantId } });
    if (byId) return byId;
  }

  const type = item.type || "original";
  const brand = item.brand?.trim() || null;
  const existing = (await prisma.partVariant.findMany({ where: { partId: familyId, type } }))
    .find((variant: { brand?: string | null }) => sameBrand(variant.brand, brand));
  if (existing) return existing;

  return prisma.partVariant.create({
    data: {
      partId: familyId,
      brand,
      type,
      sellingPriceCny: numberOrNull(item.sellingPriceCny),
      note: item.note?.trim() || null,
    },
  });
}

async function findOrCreateSupplierPrice(partVariantId: string, item: OrderCatalogItem) {
  const supplier = await findSupplier(item);
  const purchasePriceCny = numberOrNull(item.purchasePriceCny);
  if (!supplier?.id || purchasePriceCny == null) return null;

  const existing = (await prisma.partSupplierPrice.findMany({ where: { partVariantId } }))
    .find((price: { supplierId: string }) => price.supplierId === supplier.id);
  const data = {
    partVariantId,
    supplierId: supplier.id,
    purchasePriceCny,
    wholesalePriceCny: numberOrNull(item.wholesalePriceCny),
    note: item.note?.trim() || null,
  };

  if (existing) {
    return prisma.partSupplierPrice.update({ where: { id: existing.id }, data });
  }

  return prisma.partSupplierPrice.create({ data });
}

export async function attachCatalogToOrderItems<T extends OrderCatalogItem>(items: T[]) {
  let changedCatalog = false;
  const nextItems: T[] = [];

  for (const item of items) {
    let family = await findFamily(item);
    if (!family) {
      family = await prisma.part.create({
        data: {
          code: item.partCode.trim(),
          name: item.partName?.trim() || null,
          categoryId: await findCategoryId(item.categoryName),
        },
      });
      changedCatalog = true;
    }

    const variant = await findOrCreateVariant(family.id, item);
    if (!item.partVariantId || item.partVariantId !== variant.id) changedCatalog = true;

    // Always resolve supplier (even when price is missing) so supplierId is never lost
    const resolvedSupplier = await findSupplier(item);
    const supplierPrice = await findOrCreateSupplierPrice(variant.id, item);
    if (supplierPrice && (!item.partSupplierPriceId || item.partSupplierPriceId !== supplierPrice.id)) {
      changedCatalog = true;
    }

    // Prefer: supplier price ID → resolved supplier ID → item's own supplierId → null
    const resolvedSupplierId = supplierPrice?.supplierId ?? resolvedSupplier?.id ?? item.supplierId ?? null;

    nextItems.push({
      ...item,
      partId: family.id,
      partVariantId: variant.id,
      partSupplierPriceId: supplierPrice?.id ?? item.partSupplierPriceId ?? null,
      partCode: item.partCode || family.code,
      partName: item.partName || family.name || "",
      type: item.type || variant.type,
      brand: item.brand ?? variant.brand ?? "",
      supplierId: resolvedSupplierId,
      supplierName: resolvedSupplier?.name ?? item.supplierName ?? null,
      purchasePriceCny: item.purchasePriceCny != null ? Number(item.purchasePriceCny) : null,
      wholesalePriceCny: item.wholesalePriceCny != null ? Number(item.wholesalePriceCny) : null,
      sellingPriceCny: item.sellingPriceCny != null ? Number(item.sellingPriceCny) : null,
    });
  }

  if (changedCatalog) revalidateAppData("parts");
  return nextItems;
}

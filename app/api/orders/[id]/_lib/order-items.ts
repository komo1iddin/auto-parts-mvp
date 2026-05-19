import type { ExistingOrderItem, IncomingOrderItem } from "./order-types";

function numberOrPrevious(value: unknown, previous: unknown) {
  if (value != null && value !== "") return Number(value);
  if (previous != null && previous !== "") return Number(previous);
  return null;
}

function stringOrPrevious(value: unknown, previous: unknown) {
  const next = typeof value === "string" ? value.trim() : value;
  if (next) return String(next);
  if (previous) return String(previous);
  return null;
}

function findPreviousItem(
  item: IncomingOrderItem,
  existingItems: ExistingOrderItem[],
  usedExistingIds: Set<string>
) {
  const previousById = item.id
    ? existingItems.find((existingItem) => existingItem.id === item.id)
    : undefined;
  const previousByPartVariantId = item.partVariantId
    ? existingItems.find((existingItem) => (
        !usedExistingIds.has(existingItem.id) && existingItem.partVariantId === item.partVariantId
      ))
    : undefined;
  const previousByPartId = item.partId
    ? existingItems.find((existingItem) => (
        !usedExistingIds.has(existingItem.id) && existingItem.partId === item.partId
      ))
    : undefined;
  const previousByCode = existingItems.find((existingItem) => (
    !usedExistingIds.has(existingItem.id) && existingItem.partCode === item.partCode
  ));

  return previousById ?? previousByPartVariantId ?? previousByPartId ?? previousByCode;
}

export function buildReplacementItems(items: IncomingOrderItem[], existingItems: ExistingOrderItem[]) {
  const usedExistingIds = new Set<string>();

  return items.map((item) => {
    const previous = findPreviousItem(item, existingItems, usedExistingIds);
    if (previous) usedExistingIds.add(previous.id);

    return {
      partId: item.partId || previous?.partId || null,
      partVariantId: item.partVariantId || previous?.partVariantId || null,
      partSupplierPriceId: item.partSupplierPriceId || previous?.partSupplierPriceId || null,
      partCode: item.partCode,
      partName: item.partName || previous?.partName || null,
      categoryName: item.categoryName || previous?.categoryName || null,
      brand: item.brand || previous?.brand || null,
      type: item.type || previous?.type || null,
      purchasePriceCny: numberOrPrevious(item.purchasePriceCny, previous?.purchasePriceCny),
      wholesalePriceCny: numberOrPrevious(item.wholesalePriceCny, previous?.wholesalePriceCny),
      sellingPriceCny: numberOrPrevious(item.sellingPriceCny, previous?.sellingPriceCny),
      supplierId: stringOrPrevious(item.supplierId, previous?.supplierId),
      supplierName: stringOrPrevious(item.supplierName, previous?.supplierName),
      quantity: Number(item.quantity) || previous?.quantity || 1,
      note: item.note || previous?.note || null,
    };
  });
}

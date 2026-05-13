import type { OrderItem, PartSearchResult } from "@/components/orders/types/orderBuilderTypes";

export function serializeItems(items: OrderItem[]) {
  return JSON.stringify(items);
}

export function buildOrderChangelog(originalItems: OrderItem[], items: OrderItem[]) {
  const lines: string[] = [];

  for (const item of items) {
    const old = originalItems.find((original) => original.partId === item.partId);
    if (!old) {
      lines.push(`+ ${item.partCode} qo'shildi (x${item.quantity})`);
      continue;
    }

    const changes: string[] = [];
    if (old.quantity !== item.quantity) changes.push(`miqdor ${old.quantity}→${item.quantity}`);
    if (old.purchasePriceCny !== item.purchasePriceCny) changes.push(`xarid ¥${old.purchasePriceCny}→¥${item.purchasePriceCny}`);
    if (old.sellingPriceCny !== item.sellingPriceCny) changes.push(`sotuv ¥${old.sellingPriceCny}→¥${item.sellingPriceCny}`);
    if (old.type !== item.type) changes.push(`tur ${old.type}→${item.type}`);
    if (old.supplierName !== item.supplierName) changes.push(`ta'minotchi "${old.supplierName}"→"${item.supplierName}"`);
    if (changes.length) lines.push(`${item.partCode}: ${changes.join(", ")}`);
  }

  for (const old of originalItems) {
    if (!items.find((item) => item.partId === old.partId)) {
      lines.push(`- ${old.partCode} o'chirildi`);
    }
  }

  return lines.join("; ") || "O'zgarishlar kiritildi";
}

export function buildOrderItem(part: PartSearchResult): OrderItem {
  return {
    partId: part.id,
    partCode: part.code,
    partName: part.name ?? "",
    categoryName: part.category?.name ?? "",
    brand: part.brand ?? "",
    type: part.type,
    sellingPriceCny: part.sellingPriceCny ? Number(part.sellingPriceCny) : null,
    purchasePriceCny: part.purchasePriceCny ? Number(part.purchasePriceCny) : null,
    wholesalePriceCny: part.wholesalePriceCny ? Number(part.wholesalePriceCny) : null,
    supplierId: part.supplier?.id ?? "",
    supplierName: part.supplier?.name ?? "",
    quantity: 1,
    note: "",
  };
}

export function getDuplicateCodes(items: OrderItem[]) {
  return new Set(
    items
      .map((item) => item.partCode)
      .filter((code, _, allCodes) => allCodes.filter((itemCode) => itemCode === code).length > 1)
  );
}

export function getOrderTotals(items: OrderItem[]) {
  return {
    totalSelling: items.reduce((sum, item) => sum + (item.sellingPriceCny ?? 0) * item.quantity, 0),
    totalPurchase: items.reduce((sum, item) => sum + (item.purchasePriceCny ?? 0) * item.quantity, 0),
    totalQty: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

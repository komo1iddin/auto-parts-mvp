import type { OrderItem, PartSearchResult } from "@/components/orders/types/orderBuilderTypes";
import { getFulfillmentStatus } from "@/lib/order-fulfillment";

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
    if ((old.shippedQuantity ?? 0) !== (item.shippedQuantity ?? 0)) {
      changes.push(`chiqqan ${old.shippedQuantity ?? 0}→${item.shippedQuantity ?? 0}`);
    }
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
  const bestSupplierPrice = part.bestSupplierPrice ?? null;
  return {
    localId: `part-${part.id}`,
    partId: part.partId,
    partVariantId: part.id,
    partSupplierPriceId: bestSupplierPrice?.id,
    partCode: part.code,
    partName: part.name ?? "",
    categoryName: part.category?.name ?? "",
    brand: part.brand ?? "",
    type: part.type,
    sellingPriceCny: part.sellingPriceCny ? Number(part.sellingPriceCny) : null,
    purchasePriceCny: bestSupplierPrice?.purchasePriceCny != null ? Number(bestSupplierPrice.purchasePriceCny) : null,
    wholesalePriceCny: bestSupplierPrice?.wholesalePriceCny != null ? Number(bestSupplierPrice.wholesalePriceCny) : null,
    supplierId: bestSupplierPrice?.supplierId ?? "",
    supplierName: bestSupplierPrice?.supplier?.name ?? "",
    quantity: 1,
    shippedQuantity: 0,
    fulfillmentStatus: "waiting",
    note: "",
  };
}

export function getDuplicateCodes(items: OrderItem[]) {
  const keys = items.map((item) => `${item.partCode.trim().toLowerCase()}::${item.type}`);
  return new Set(
    keys.filter((key, _, allKeys) => allKeys.filter((itemKey) => itemKey === key).length > 1)
  );
}

export function getOrderTotals(items: OrderItem[]) {
  return {
    totalSelling: items.reduce((sum, item) => sum + (item.sellingPriceCny ?? 0) * item.quantity, 0),
    totalPurchase: items.reduce((sum, item) => sum + (item.purchasePriceCny ?? 0) * item.quantity, 0),
    totalQty: items.reduce((sum, item) => sum + item.quantity, 0),
    shippedQty: items.reduce((sum, item) => sum + Math.min(item.shippedQuantity ?? 0, item.quantity), 0),
  };
}

export function withFulfillment(item: OrderItem): OrderItem {
  return {
    ...item,
    shippedQuantity: Math.min(Math.max(0, Math.floor(Number(item.shippedQuantity) || 0)), item.quantity),
    fulfillmentStatus: getFulfillmentStatus(item.quantity, item.shippedQuantity),
  };
}

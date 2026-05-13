import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";

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

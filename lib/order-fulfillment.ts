export type OrderItemFulfillmentStatus = "waiting" | "partial" | "shipped";

export const ORDER_ITEM_FULFILLMENT_LABELS: Record<OrderItemFulfillmentStatus, string> = {
  waiting: "Kutilmoqda",
  partial: "Qisman chiqdi",
  shipped: "Chiqarildi",
};

export const ORDER_ITEM_FULFILLMENT_STYLES: Record<OrderItemFulfillmentStatus, string> = {
  waiting: "bg-slate-100 text-slate-700",
  partial: "bg-amber-50 text-amber-800",
  shipped: "bg-emerald-50 text-emerald-800",
};

export function clampShippedQuantity(value: unknown, quantity: unknown) {
  const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
  const shipped = Math.max(0, Math.floor(Number(value) || 0));
  return Math.min(shipped, safeQuantity);
}

export function getFulfillmentStatus(quantity: unknown, shippedQuantity: unknown): OrderItemFulfillmentStatus {
  const safeQuantity = Math.max(0, Math.floor(Number(quantity) || 0));
  const shipped = clampShippedQuantity(shippedQuantity, safeQuantity);

  if (safeQuantity <= 0 || shipped <= 0) return "waiting";
  if (shipped >= safeQuantity) return "shipped";
  return "partial";
}

export function getOrderFulfillmentSummary<T extends { quantity: number; shippedQuantity?: number | null }>(items: T[] = []) {
  const totalQty = items.reduce((sum, item) => sum + Math.max(0, Number(item.quantity) || 0), 0);
  const shippedQty = items.reduce((sum, item) => sum + clampShippedQuantity(item.shippedQuantity, item.quantity), 0);
  const waitingQty = Math.max(totalQty - shippedQty, 0);
  const status = getFulfillmentStatus(totalQty, shippedQty);
  const percent = totalQty > 0 ? Math.round((shippedQty / totalQty) * 100) : 0;

  return { totalQty, shippedQty, waitingQty, status, percent };
}

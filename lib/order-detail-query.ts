import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { ExportRecord, OrderDetail } from "@/components/orders/types/orderDetailTypes";
import type { PaymentRecord } from "@/components/orders/types/orderFinanceTypes";
import type { FinancePayment } from "@/lib/order-finance";

type AnyRecord = Record<string, any>;
type OrderDetailFast = OrderDetail & {
  customerId?: string | null;
  createdBy?: string | null;
  exports?: Array<ExportRecord & AnyRecord>;
  clientPayments?: Array<PaymentRecord & FinancePayment & AnyRecord>;
  supplierPayments?: Array<PaymentRecord & FinancePayment & AnyRecord>;
  profitWithdrawals?: Array<PaymentRecord & FinancePayment & AnyRecord>;
};

const dateFields = new Set(["createdAt", "updatedAt", "paymentDate"]);

function camelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function normalizeValue(key: string, value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => normalizeOrderRow(item));
  if (value && typeof value === "object") return normalizeOrderRow(value as AnyRecord);

  const field = camelCase(key);
  if (dateFields.has(field) && typeof value === "string") return new Date(value);
  return value;
}

function normalizeOrderRow<T extends AnyRecord>(row: T | null): AnyRecord | null {
  if (!row) return null;
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [camelCase(key), normalizeValue(key, value)])
  );
}

function sortByDateDesc<T extends { createdAt?: Date; paymentDate?: Date }>(rows: T[] = [], field: "createdAt" | "paymentDate" = "createdAt") {
  return [...rows].sort((a, b) => (b[field]?.getTime() ?? 0) - (a[field]?.getTime() ?? 0));
}

function sortByPartCode<T extends { partCode?: string }>(rows: T[] = []) {
  return [...rows].sort((a, b) => (a.partCode ?? "").localeCompare(b.partCode ?? ""));
}

function sortByVersionDesc<T extends { version?: number }>(rows: T[] = []) {
  return [...rows].sort((a, b) => (b.version ?? 0) - (a.version ?? 0));
}

export async function getOrderDetailFast(id: string): Promise<OrderDetailFast | null> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      customer:customers(name),
      creator:users!orders_created_by_fkey(name),
      updater:users!orders_updated_by_fkey(name),
      items:order_items(*),
      revisions:order_revisions(*, changer:users(name)),
      clientPayments:client_payments(*, creator:users(name)),
      supplierPayments:supplier_payments(*, creator:users(name), supplier:suppliers(name)),
      profitWithdrawals:profit_withdrawals(*, creator:users(name)),
      exports:order_exports(*)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const order = normalizeOrderRow(data);
  if (!order) return null;

  order.items = sortByPartCode(order.items);
  order.revisions = sortByVersionDesc(order.revisions);
  order.clientPayments = sortByDateDesc(order.clientPayments, "paymentDate");
  order.supplierPayments = sortByDateDesc(order.supplierPayments, "paymentDate");
  order.profitWithdrawals = sortByDateDesc(order.profitWithdrawals, "paymentDate");
  order.exports = sortByDateDesc(order.exports, "createdAt");

  return order as OrderDetailFast;
}

import type {
  OrderFinanceStatus,
  PaymentStatus,
} from "@/lib/order-finance";

export const CLIENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "To'lanmagan",
  partially_paid: "Qisman",
  paid: "To'langan",
  overpaid: "Ortiqcha",
};

export const FINANCE_STATUS_LABELS: Record<OrderFinanceStatus, string> = {
  waiting_client_payment: "Mijoz kutilmoqda",
  client_partially_paid: "Mijoz qisman",
  ready_to_pay_supplier: "Ta'minotchiga to'lash mumkin",
  supplier_partially_paid: "Ta'minotchi qisman",
  supplier_paid: "Ta'minotchi to'langan",
  closed: "Yopilgan",
};

export function statusTextClass(status: PaymentStatus | OrderFinanceStatus) {
  if (status === "paid" || status === "closed" || status === "supplier_paid") return "text-green-600";
  if (status === "unpaid" || status === "waiting_client_payment") return "text-red-600";
  return "text-gray-900";
}

export function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("uz");
}

export function valueTone(value: number, positiveIsGood = true) {
  if (value === 0) return "text-gray-900";
  if (positiveIsGood) return value > 0 ? "text-green-600" : "text-red-600";
  return value > 0 ? "text-red-600" : "text-green-600";
}

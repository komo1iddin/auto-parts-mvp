export const PAYMENT_METHODS = ["cash", "bank", "alipay", "wechat", "other"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Naqd",
  bank: "Bank",
  alipay: "Alipay",
  wechat: "WeChat",
  other: "Boshqa",
};

export type PaymentStatus = "unpaid" | "partially_paid" | "paid" | "overpaid";

export type OrderFinanceStatus =
  | "waiting_client_payment"
  | "client_partially_paid"
  | "ready_to_pay_supplier"
  | "supplier_partially_paid"
  | "supplier_paid"
  | "closed";

export interface FinanceItem {
  supplierId?: string | null;
  supplierName?: string | null;
  quantity: number;
  purchasePriceCny?: { toString(): string } | number | string | null;
  sellingPriceCny?: { toString(): string } | number | string | null;
}

export interface FinancePayment {
  supplierId?: string | null;
  amountCny: { toString(): string } | number | string | null;
}

export interface SupplierFinanceBreakdown {
  supplierId: string | null;
  supplierName: string;
  itemCount: number;
  supplierTotal: number;
  supplierPaid: number;
  supplierBalance: number;
}

export interface OrderFinanceSummary {
  clientTotal: number;
  supplierTotal: number;
  expectedGrossProfit: number;
  profitWithdrawn: number;
  profitBalance: number;
  clientPaid: number;
  supplierPaid: number;
  clientBalance: number;
  supplierBalance: number;
  cashDifference: number;
  clientPaymentStatus: PaymentStatus;
  supplierPaymentStatus: PaymentStatus;
  orderFinanceStatus: OrderFinanceStatus;
  supplierBreakdown: SupplierFinanceBreakdown[];
}

export function moneyToNumber(value: FinanceItem["purchasePriceCny"] | FinancePayment["amountCny"]) {
  if (value == null) return 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getPaymentStatus(total: number, paid: number): PaymentStatus {
  if (paid <= 0) return "unpaid";
  if (paid > total) return "overpaid";
  if (paid === total) return "paid";
  return "partially_paid";
}

export function getOrderFinanceStatus(
  clientTotal: number,
  clientPaid: number,
  supplierTotal: number,
  supplierPaid: number
): OrderFinanceStatus {
  const clientStatus = getPaymentStatus(clientTotal, clientPaid);
  const supplierStatus = getPaymentStatus(supplierTotal, supplierPaid);

  if (clientStatus === "paid" && supplierStatus === "paid") return "closed";
  if (supplierStatus === "paid" || supplierStatus === "overpaid") return "supplier_paid";
  if (supplierStatus === "partially_paid") return "supplier_partially_paid";
  if (clientStatus === "paid" || clientStatus === "overpaid") return "ready_to_pay_supplier";
  if (clientStatus === "partially_paid") return "client_partially_paid";
  return "waiting_client_payment";
}

export function calculateOrderFinance(
  items: FinanceItem[] = [],
  clientPayments: FinancePayment[] = [],
  supplierPayments: FinancePayment[] = [],
  profitWithdrawals: FinancePayment[] = []
): OrderFinanceSummary {
  const clientTotal = items.reduce(
    (sum, item) => sum + moneyToNumber(item.sellingPriceCny) * item.quantity,
    0
  );
  const supplierTotal = items.reduce(
    (sum, item) => sum + moneyToNumber(item.purchasePriceCny) * item.quantity,
    0
  );
  const clientPaid = clientPayments.reduce((sum, payment) => sum + moneyToNumber(payment.amountCny), 0);
  const supplierPaid = supplierPayments.reduce((sum, payment) => sum + moneyToNumber(payment.amountCny), 0);
  const profitWithdrawn = profitWithdrawals.reduce((sum, payment) => sum + moneyToNumber(payment.amountCny), 0);

  const supplierMap = new Map<string, SupplierFinanceBreakdown>();
  for (const item of items) {
    const key = item.supplierId ?? "__no_supplier__";
    const existing = supplierMap.get(key) ?? {
      supplierId: item.supplierId ?? null,
      supplierName: item.supplierName || "Ta'minotchi yo'q",
      itemCount: 0,
      supplierTotal: 0,
      supplierPaid: 0,
      supplierBalance: 0,
    };
    existing.itemCount += 1;
    existing.supplierTotal += moneyToNumber(item.purchasePriceCny) * item.quantity;
    supplierMap.set(key, existing);
  }

  for (const payment of supplierPayments) {
    const key = payment.supplierId ?? "__no_supplier__";
    const existing = supplierMap.get(key);
    if (existing) existing.supplierPaid += moneyToNumber(payment.amountCny);
  }

  const supplierBreakdown = [...supplierMap.values()]
    .map((row) => ({
      ...row,
      supplierBalance: row.supplierTotal - row.supplierPaid,
    }))
    .sort((a, b) => a.supplierName.localeCompare(b.supplierName));

  const expectedGrossProfit = clientTotal - supplierTotal;

  return {
    clientTotal,
    supplierTotal,
    expectedGrossProfit,
    profitWithdrawn,
    profitBalance: expectedGrossProfit - profitWithdrawn,
    clientPaid,
    supplierPaid,
    clientBalance: clientTotal - clientPaid,
    supplierBalance: supplierTotal - supplierPaid,
    cashDifference: clientPaid - supplierPaid - profitWithdrawn,
    clientPaymentStatus: getPaymentStatus(clientTotal, clientPaid),
    supplierPaymentStatus: getPaymentStatus(supplierTotal, supplierPaid),
    orderFinanceStatus: getOrderFinanceStatus(clientTotal, clientPaid, supplierTotal, supplierPaid),
    supplierBreakdown,
  };
}

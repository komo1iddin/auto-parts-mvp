import type {
  OrderFinanceSummary,
  PaymentMethod,
} from "@/lib/order-finance";

export interface PaymentRecord {
  id: string;
  amountCny: string | number | { toString(): string };
  paymentDate: Date | string;
  paymentMethod: string;
  note: string | null;
  createdAt: Date | string;
  creator?: { name: string } | null;
  supplierId?: string | null;
  supplier?: { name: string } | null;
}

export interface SupplierOption {
  id: string;
  name: string;
}

export interface PaymentForm {
  id?: string;
  supplierId: string;
  amountCny: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note: string;
}

export type PaymentKind = "client" | "supplier";
export type FinanceTabKey = "suppliers" | "client" | "supplier";

export interface OrderFinancePageProps {
  orderId: string;
  orderNumber: string;
  backPath: string;
  isAdmin: boolean;
  canManageClientPayments: boolean;
  summary: OrderFinanceSummary;
  clientPayments: PaymentRecord[];
  supplierPayments: PaymentRecord[];
  suppliers: SupplierOption[];
}

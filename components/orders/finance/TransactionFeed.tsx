import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PaymentKind, PaymentRecord } from "@/components/orders/types/orderFinanceTypes";
import { formatDate } from "@/components/orders/finance/orderFinanceUtils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/order-finance";
import { cn, formatCny } from "@/lib/utils";

interface TransactionFeedProps {
  clientPayments: PaymentRecord[];
  supplierPayments: PaymentRecord[];
  profitWithdrawals: PaymentRecord[];
  canCreate: boolean;
  canEdit: boolean;
  onCreate: () => void;
  onEdit: (kind: PaymentKind, payment: PaymentRecord) => void;
  onDelete: (kind: PaymentKind, payment: PaymentRecord) => void;
}

type Transaction = PaymentRecord & {
  kind: PaymentKind;
  signedAmount: number;
  displayKind: "client" | "supplier" | "refund" | "profit";
};

export function TransactionFeed({
  clientPayments,
  supplierPayments,
  profitWithdrawals,
  canCreate,
  canEdit,
  onCreate,
  onEdit,
  onDelete,
}: TransactionFeedProps) {
  const transactions: Transaction[] = [
    ...clientPayments.map((payment) => ({
      ...payment,
      kind: "client" as const,
      signedAmount: Number(payment.amountCny),
      displayKind: Number(payment.amountCny) < 0 ? ("refund" as const) : ("client" as const),
    })),
    ...supplierPayments.map((payment) => ({
      ...payment,
      kind: "supplier" as const,
      signedAmount: -Number(payment.amountCny),
      displayKind: "supplier" as const,
    })),
    ...profitWithdrawals.map((payment) => ({
      ...payment,
      kind: "profit" as const,
      signedAmount: -Number(payment.amountCny),
      displayKind: "profit" as const,
    })),
  ].sort((a, b) => {
    const dateDiff = new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-950">To'lovlar tarixi</h2>
          <p className="mt-0.5 text-xs text-gray-500">Mijoz to'lovi, ta'minotchi to'lovi, qaytarim va foyda.</p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" />
            Tranzaksiya
          </Button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {transactions.map((transaction) => {
          const isIncome = transaction.displayKind === "client";
          const isRefund = transaction.displayKind === "refund";
          const isProfit = transaction.displayKind === "profit";
          return (
            <div key={`${transaction.kind}-${transaction.id}`} className="flex gap-3 px-4 py-3 hover:bg-gray-50/70">
              <div
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                  isIncome
                    ? "border-green-100 bg-green-50 text-green-700"
                    : "border-red-100 bg-red-50 text-red-700"
                )}
              >
                {isIncome ? "+" : "-"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-gray-950">
                    {isIncome ? "Mijoz to'lovi" : isRefund ? "Qaytarim" : isProfit ? "Foyda olindi" : "Ta'minotchi to'lovi"}
                  </span>
                  {transaction.displayKind === "supplier" && transaction.supplier?.name && (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                      {transaction.supplier.name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{formatDate(transaction.paymentDate)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                  <span>
                    {PAYMENT_METHOD_LABELS[transaction.paymentMethod as PaymentMethod] ?? transaction.paymentMethod}
                  </span>
                  <span className="text-gray-300">/</span>
                  <span>{transaction.creator?.name ?? "System"}</span>
                  {transaction.note && (
                    <>
                      <span className="text-gray-300">/</span>
                      <span className="max-w-md truncate">{transaction.note}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-2">
                <div
                  className={cn(
                    "min-w-28 text-right text-sm font-semibold tabular-nums",
                    isIncome ? "text-green-700" : "text-red-700"
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {formatCny(Math.abs(transaction.signedAmount))}
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      aria-label="Tahrirlash"
                      onClick={() => onEdit(transaction.kind, transaction)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-red-600 hover:bg-gray-100"
                      aria-label="O'chirish"
                      onClick={() => onDelete(transaction.kind, transaction)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {transactions.length === 0 && (
          <div className="flex items-center gap-3 px-4 py-8 text-sm text-gray-500">
            <span className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-400">
              <RefreshCcw className="size-4" />
            </span>
            Hali tranzaksiya kiritilmagan.
          </div>
        )}
      </div>
    </section>
  );
}

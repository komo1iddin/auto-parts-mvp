import type { OrderFinanceSummary } from "@/lib/order-finance";
import { cn, formatCny } from "@/lib/utils";
import {
  CLIENT_STATUS_LABELS,
  FINANCE_STATUS_LABELS,
  valueTone,
} from "@/components/orders/finance/orderFinanceUtils";

interface FinanceSummaryCardsProps {
  isAdmin: boolean;
  summary: OrderFinanceSummary;
}

export function FinanceSummaryCards({ isAdmin, summary }: FinanceSummaryCardsProps) {
  const rows = [
    {
      label: "Mijoz to'ladi",
      value: summary.clientPaid,
      meta: `${formatCny(summary.clientBalance)} qarz`,
      className: summary.clientBalance > 0 ? "text-red-600" : "text-green-600",
    },
    ...(isAdmin
      ? [
          {
            label: "Ta'minotchi to'landi",
            value: summary.supplierPaid,
            meta: `${formatCny(summary.supplierBalance)} qarz`,
            className: summary.supplierBalance > 0 ? "text-red-600" : "text-green-600",
          },
          {
            label: "Foyda olindi",
            value: summary.profitWithdrawn,
            meta: `${formatCny(summary.profitBalance)} qoldi`,
            className: summary.profitWithdrawn > 0 ? "text-green-600" : "text-gray-900",
          },
          {
            label: "Kassada",
            value: summary.cashDifference,
            meta: "mijozdan qolgan pul",
            className: valueTone(summary.cashDifference),
          },
        ]
      : []),
  ];

  return (
    <aside className="sticky top-16 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Moliya xulosasi</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-950">
            {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
          </span>
          {isAdmin && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-medium text-gray-600">
                {FINANCE_STATUS_LABELS[summary.orderFinanceStatus]}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map((row) => (
          <div key={row.label} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-gray-500">{row.label}</div>
                <div className="mt-0.5 text-xs text-gray-400">{row.meta}</div>
              </div>
              <div className={cn("text-right text-base font-semibold tabular-nums", row.className)}>
                {formatCny(row.value)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-gray-100 bg-gray-100">
        <div className="bg-gray-50 px-4 py-3">
          <div className="text-[11px] font-medium uppercase text-gray-400">Mijoz jami</div>
          <div className="mt-1 text-sm font-semibold text-gray-950">{formatCny(summary.clientTotal)}</div>
        </div>
        <div className="bg-gray-50 px-4 py-3">
          <div className="text-[11px] font-medium uppercase text-gray-400">Ta'minotchi jami</div>
          <div className="mt-1 text-sm font-semibold text-gray-950">
            {isAdmin ? formatCny(summary.supplierTotal) : "-"}
          </div>
        </div>
      </div>
    </aside>
  );
}

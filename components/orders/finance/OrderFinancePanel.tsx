import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type OrderFinanceSummary, type PaymentStatus } from "@/lib/order-finance";
import { cn, formatCny } from "@/lib/utils";

interface OrderFinancePanelProps {
  orderId: string;
  financePath: string;
  isAdmin: boolean;
  summary: OrderFinanceSummary;
}

const CLIENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "To'lanmagan",
  partially_paid: "Qisman to'langan",
  paid: "To'langan",
  overpaid: "Ortiqcha to'langan",
};

function statusBadgeClass(status: PaymentStatus) {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "overpaid") return "bg-green-50 text-green-600";
  if (status === "partially_paid") return "bg-yellow-100 text-yellow-700";
  return "bg-gray-100 text-gray-600";
}

export function OrderFinancePanel({
  financePath,
  isAdmin,
  summary,
}: OrderFinancePanelProps) {
  const stats = [
    { label: "Jami", value: formatCny(summary.clientTotal), className: "text-gray-900" },
    { label: "To'landi", value: formatCny(summary.clientPaid), className: "text-gray-900" },
    {
      label: "Qoldiq",
      value: formatCny(summary.clientBalance),
      className: summary.clientBalance > 0 ? "text-red-600" : "text-green-600",
    },
    ...(isAdmin
      ? [
          {
            label: "Foyda",
            value: formatCny(summary.expectedGrossProfit),
            className: summary.expectedGrossProfit >= 0 ? "text-green-600" : "text-red-600",
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Moliya</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                statusBadgeClass(summary.clientPaymentStatus)
              )}
            >
              {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-32 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <div className="text-xs font-medium text-gray-500">{stat.label}</div>
                <div className={cn("mt-0.5 text-sm font-semibold", stat.className)}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={financePath}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:text-gray-900"
        >
          Moliya paneli
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

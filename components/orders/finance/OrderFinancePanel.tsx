import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
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
  const stats: { label: string; value: string; tone: FinanceTone }[] = [
    { label: "Jami", value: formatCny(summary.clientTotal), tone: "neutral" },
    { label: "To'landi", value: formatCny(summary.clientPaid), tone: "neutral" },
    {
      label: "Qoldiq",
      value: formatCny(summary.clientBalance),
      tone: summary.clientBalance > 0 ? "danger" : "balance",
    },
    ...(isAdmin
      ? [
          {
            label: "Foyda",
            value: formatCny(summary.expectedGrossProfit),
            tone: (summary.expectedGrossProfit >= 0 ? "profit" : "danger") as FinanceTone,
          },
        ]
      : []),
  ];

  return (
    <section className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
              <Landmark className="size-4" />
            </span>
            <h2 className="text-base font-semibold text-gray-950">Moliya</h2>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                statusBadgeClass(summary.clientPaymentStatus)
              )}
            >
              {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className={cn("min-w-32 rounded-lg border px-3 py-2.5", financeToneClasses[stat.tone].card)}>
                <div className="text-xs font-medium text-gray-500">{stat.label}</div>
                <div className={cn("mt-1 text-base font-semibold", financeToneClasses[stat.tone].value)}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Link
          href={financePath}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950"
        >
          Moliya paneli
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

type FinanceTone = "neutral" | "balance" | "profit" | "danger";

const financeToneClasses: Record<FinanceTone, { card: string; value: string }> = {
  neutral: {
    card: "border-gray-100 bg-gray-50",
    value: "text-gray-950",
  },
  balance: {
    card: "border-sky-100 bg-sky-50/60",
    value: "text-sky-700",
  },
  profit: {
    card: "border-emerald-100 bg-emerald-50/60",
    value: "text-emerald-700",
  },
  danger: {
    card: "border-red-100 bg-red-50/60",
    value: "text-red-700",
  },
};

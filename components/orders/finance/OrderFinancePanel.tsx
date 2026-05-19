"use client";

import { useState } from "react";
import { ArrowRight, Landmark } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { OrderFinancePage } from "@/components/orders/OrderFinancePage";
import { OrderMetric, OrderMetricStrip, OrderSection } from "@/components/orders/detail/OrderSection";
import { OrderSectionActionButton } from "@/components/orders/detail/OrderSectionActionButton";
import type { PaymentRecord, SupplierOption } from "@/components/orders/types/orderFinanceTypes";
import { type OrderFinanceSummary, type PaymentStatus } from "@/lib/order-finance";
import { cn, formatCny } from "@/lib/utils";

interface OrderFinancePanelProps {
  orderId: string;
  orderNumber: string;
  financePath: string;
  isAdmin: boolean;
  canManageClientPayments: boolean;
  summary: OrderFinanceSummary;
  clientPayments: PaymentRecord[];
  supplierPayments: PaymentRecord[];
  profitWithdrawals: PaymentRecord[];
  suppliers: SupplierOption[];
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
  orderId,
  orderNumber,
  financePath,
  isAdmin,
  canManageClientPayments,
  summary,
  clientPayments,
  supplierPayments,
  profitWithdrawals,
  suppliers,
}: OrderFinancePanelProps) {
  const [open, setOpen] = useState(false);
  const stats: { label: string; value: string; className?: string }[] = [
    { label: "Jami", value: formatCny(summary.clientTotal) },
    { label: "To'landi", value: formatCny(summary.clientPaid), className: summary.clientPaid > 0 ? "text-emerald-700" : undefined },
    {
      label: "Qoldiq",
      value: formatCny(summary.clientBalance),
      className: summary.clientBalance > 0 ? "text-red-700" : "text-emerald-700",
    },
    ...(isAdmin
      ? [
          {
            label: "Foyda",
            value: formatCny(summary.expectedGrossProfit),
            className: summary.expectedGrossProfit >= 0 ? "text-emerald-700" : "text-red-700",
          },
        ]
      : []),
  ];

  return (
    <OrderSection
      icon={<Landmark className="size-4" />}
      title="Moliya"
      badge={(
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            statusBadgeClass(summary.clientPaymentStatus)
          )}
        >
          {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
        </span>
      )}
      action={(
        <OrderSectionActionButton
          onClick={() => setOpen(true)}
          icon={<ArrowRight />}
        >
          Moliya paneli
        </OrderSectionActionButton>
      )}
    >
      <OrderMetricStrip>
        {stats.map((stat) => (
          <OrderMetric key={stat.label} label={stat.label} value={stat.value} valueClassName={stat.className} />
        ))}
      </OrderMetricStrip>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Moliya: ${orderNumber}`}
        className="max-w-[1400px] p-0"
      >
        <OrderFinancePage
          orderId={orderId}
          orderNumber={orderNumber}
          backPath={financePath}
          isAdmin={isAdmin}
          canManageClientPayments={canManageClientPayments}
          embedded
          summary={summary}
          clientPayments={clientPayments}
          supplierPayments={supplierPayments}
          profitWithdrawals={profitWithdrawals}
          suppliers={suppliers}
        />
      </Modal>
    </OrderSection>
  );
}

import type { OrderFinanceSummary } from "@/lib/order-finance";
import { cn } from "@/lib/utils";
import { FinanceBlock } from "@/components/orders/FinanceBlock";
import {
  CLIENT_STATUS_LABELS,
  valueTone,
} from "@/components/orders/orderFinanceUtils";

interface FinanceSummaryCardsProps {
  isAdmin: boolean;
  summary: OrderFinanceSummary;
}

export function FinanceSummaryCards({ isAdmin, summary }: FinanceSummaryCardsProps) {
  return (
    <div className={cn("grid gap-3", isAdmin ? "lg:grid-cols-3" : "max-w-md")}>
      <FinanceBlock
        label="Mijoz"
        status={CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
        total={summary.clientTotal}
        items={[
          { label: "Paid", value: summary.clientPaid, className: summary.clientPaid > 0 ? "text-green-600" : "text-gray-900" },
          {
            label: "Balance",
            value: summary.clientBalance,
            className: valueTone(summary.clientBalance, false),
          },
        ]}
      />

      {isAdmin && (
        <FinanceBlock
          label="Suppliers"
          total={summary.supplierTotal}
          items={[
            { label: "Paid", value: summary.supplierPaid, className: summary.supplierPaid > 0 ? "text-green-600" : "text-gray-900" },
            {
              label: "Balance",
              value: summary.supplierBalance,
              className: valueTone(summary.supplierBalance, false),
            },
          ]}
        />
      )}

      {isAdmin && (
        <FinanceBlock
          label="Profit"
          total={summary.expectedGrossProfit}
          featured
          items={[
            {
              label: "Cash Difference",
              value: summary.cashDifference,
              className: valueTone(summary.cashDifference),
            },
          ]}
        />
      )}
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { OrderFinanceSummary } from "@/lib/order-finance";
import {
  CLIENT_STATUS_LABELS,
  FINANCE_STATUS_LABELS,
  statusTextClass,
} from "@/components/orders/finance/orderFinanceUtils";

interface FinancePageHeaderProps {
  orderNumber: string;
  backPath: string;
  isAdmin: boolean;
  summary: OrderFinanceSummary;
  isPending: boolean;
}

export function FinancePageHeader({
  orderNumber,
  backPath,
  isAdmin,
  summary,
  isPending,
}: FinancePageHeaderProps) {
  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-5">
        <Link
          href={backPath}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          <ArrowLeft className="size-4" />
          Orqaga
        </Link>
        <span className="text-gray-200">/</span>
        <span className="text-sm font-semibold text-gray-900">{orderNumber}</span>
        <div className="min-w-0 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <span className={statusTextClass(summary.clientPaymentStatus)}>
            {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
          </span>
          {isAdmin && (
            <>
              <span className="px-1.5 text-gray-300">•</span>
              <span className={statusTextClass(summary.orderFinanceStatus)}>
                {FINANCE_STATUS_LABELS[summary.orderFinanceStatus]}
              </span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {isPending && <span className="text-xs text-gray-400">Yangilanmoqda...</span>}
        </div>
      </div>
    </div>
  );
}

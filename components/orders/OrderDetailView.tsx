import { OrderDetailHeader } from "@/components/orders/detail/OrderDetailHeader";
import { OrderDetailItemsTable } from "@/components/orders/detail/OrderDetailItemsTable";
import { OrderRevisions } from "@/components/orders/detail/OrderRevisions";
import type { OrderDetailViewProps } from "@/components/orders/types/orderDetailTypes";
import { exportLabel } from "@/components/orders/detail/orderDetailUtils";

export function OrderDetailView({ order, isAdmin, basePath, exports, financePanel, financeSummary }: OrderDetailViewProps) {
  const supplierNames = [...new Set(order.items.map((item) => item.supplierName).filter(isPresent))];
  const supplierIds = [...new Set(order.items.map((item) => item.supplierId).filter(isPresent))];
  const latestExport = [...exports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  return (
    <div className="space-y-5">
      <OrderDetailHeader
        order={order}
        isAdmin={isAdmin}
        basePath={basePath}
        supplierIds={supplierIds}
        supplierNames={supplierNames}
        latestExportLabel={exportLabel(latestExport)}
      />

      {financePanel}

      <OrderDetailItemsTable order={order} isAdmin={isAdmin} financeSummary={financeSummary} />

      <OrderRevisions revisions={order.revisions} />
    </div>
  );
}

function isPresent(value: string | null | undefined): value is string {
  return Boolean(value);
}

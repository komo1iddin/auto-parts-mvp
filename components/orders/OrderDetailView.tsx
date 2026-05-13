import { OrderDetailHeader } from "@/components/orders/OrderDetailHeader";
import { OrderDetailItemsTable } from "@/components/orders/OrderDetailItemsTable";
import { OrderRevisions } from "@/components/orders/OrderRevisions";
import type { OrderDetailViewProps } from "@/components/orders/orderDetailTypes";
import { exportLabel } from "@/components/orders/orderDetailUtils";

export function OrderDetailView({ order, isAdmin, basePath, exports, financePanel }: OrderDetailViewProps) {
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

      <OrderDetailItemsTable order={order} isAdmin={isAdmin} />

      <OrderRevisions revisions={order.revisions} />
    </div>
  );
}

function isPresent(value: string | null | undefined): value is string {
  return Boolean(value);
}

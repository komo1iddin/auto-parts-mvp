import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CancelOrderButton } from "@/components/orders/actions/CancelOrderButton";
import { ExportButtons } from "@/components/orders/actions/ExportButtons";
import { OrderTitleEditor } from "@/components/orders/actions/OrderTitleEditor";
import type { OrderDetail } from "@/components/orders/types/orderDetailTypes";
import { formatDateTime } from "@/components/orders/detail/orderDetailUtils";
import { ORDER_STATUSES } from "@/lib/utils";

interface OrderDetailHeaderProps {
  order: OrderDetail;
  isAdmin: boolean;
  basePath: "/admin/orders" | "/manager/orders";
  supplierIds: string[];
  supplierNames: string[];
  latestExportLabel?: string;
}

export function OrderDetailHeader({
  order,
  isAdmin,
  basePath,
  supplierIds,
  supplierNames,
  latestExportLabel,
}: OrderDetailHeaderProps) {
  const status = ORDER_STATUSES[order.status];

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <OrderTitleEditor orderId={order.id} title={order.currentOrderNumber} />
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.color ?? ""}`}>
              {status?.label ?? order.status}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">V{order.version}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <ExportButtons
            orderId={order.id}
            supplierIds={isAdmin ? supplierIds : []}
            isAdmin={isAdmin}
            latestExportLabel={latestExportLabel}
          />
          {order.status !== "cancelled" && (
            <>
              <Link href={`${basePath}/${order.id}/edit`} prefetch={false}>
                <Button size="sm" variant="secondary">
                  <Pencil className="size-4" />
                  Tahrirlash
                </Button>
              </Link>
              <CancelOrderButton orderId={order.id} orderNumber={order.currentOrderNumber} size="sm" />
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
        <MetaItem label="Yaratilgan" value={formatDateTime(order.createdAt)} />
        <MetaItem label="Oxirgi tahrir" value={formatDateTime(order.updatedAt)} />
        <MetaItem label="Yaratdi" value={order.creator?.name ?? "—"} />
        <MetaItem label="Tahrirladi" value={order.updater?.name ?? "—"} />
        <MetaItem
          label="Ta'minotchi"
          value={supplierNames.length ? supplierNames.join(", ") : "—"}
          title={supplierNames.join(", ")}
        />
      </div>
    </div>
  );
}

function MetaItem({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="ml-2 font-medium text-gray-800" title={title}>{value}</span>
    </div>
  );
}

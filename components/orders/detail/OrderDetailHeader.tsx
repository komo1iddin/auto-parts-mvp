import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarClock, Pencil, Truck, UserPen, UserRound, UserRoundCog } from "lucide-react";
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
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <OrderTitleEditor orderId={order.id} title={order.currentOrderNumber} />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status?.color ?? ""}`}>
                {status?.label ?? order.status}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">V{order.version}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2 rounded-lg border border-gray-100 bg-gray-50 p-1">
            <ExportButtons
              orderId={order.id}
              supplierIds={isAdmin ? supplierIds : []}
              isAdmin={isAdmin}
              latestExportLabel={latestExportLabel}
            />
            {order.status !== "cancelled" && (
              <>
                <Link href={`${basePath}/${order.id}/edit`}>
                  <Button size="sm" variant="secondary" className="bg-white">
                    <Pencil className="size-4" />
                    Tahrirlash
                  </Button>
                </Link>
                <CancelOrderButton orderId={order.id} orderNumber={order.currentOrderNumber} size="sm" />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-gray-100 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetaItem label="Yaratilgan" value={formatDateTime(order.createdAt)} icon={<CalendarClock className="size-4" />} />
        <MetaItem label="Mijoz" value={order.customer?.name ?? "—"} icon={<UserRound className="size-4" />} strong />
        <MetaItem label="Oxirgi tahrir" value={formatDateTime(order.updatedAt)} icon={<CalendarClock className="size-4" />} />
        <MetaItem label="Yaratdi" value={order.creator?.name ?? "—"} icon={<UserPen className="size-4" />} />
        <MetaItem label="Tahrirladi" value={order.updater?.name ?? "—"} icon={<UserRoundCog className="size-4" />} />
        <MetaItem
          label="Ta'minotchi"
          value={supplierNames.length ? supplierNames.join(", ") : "—"}
          title={supplierNames.join(", ")}
          icon={<Truck className="size-4" />}
        />
      </div>
    </div>
  );
}

function MetaItem({
  label,
  value,
  title,
  icon,
  strong = false,
}: {
  label: string;
  value: string;
  title?: string;
  icon?: ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0 bg-white px-5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {icon && <span className="text-gray-300">{icon}</span>}
        {label}
      </div>
      <div className={`mt-1 truncate text-sm ${strong ? "font-semibold text-gray-950" : "font-medium text-gray-700"}`} title={title}>
        {value}
      </div>
    </div>
  );
}

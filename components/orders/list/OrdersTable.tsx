"use client";

import { useRouter } from "next/navigation";
import { X, PackageSearch } from "lucide-react";
import type { OrderListItem } from "@/components/orders/types/ordersListTypes";
import { ORDER_STATUSES, formatCny } from "@/lib/utils";

interface OrdersTableProps {
  orders: OrderListItem[];
  basePath: "/admin/orders" | "/manager/orders";
  isAdmin: boolean;
  canShowCreator: boolean;
  isPending: boolean;
  onCancelOrder: (order: OrderListItem) => void;
}

export function OrdersTable({
  orders,
  basePath,
  isAdmin,
  canShowCreator,
  isPending,
  onCancelOrder,
}: OrdersTableProps) {
  return (
    <div className={`overflow-x-auto transition-opacity ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70">
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Raqam</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Mijoz</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Holat</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Ver.</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">Qismlar</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">Miqdor</th>
            {isAdmin && (
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">Xarid</th>
            )}
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sotuv</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Ta'minotchi</th>
            {canShowCreator && (
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Yaratdi</th>
            )}
            <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sana</th>
            <th className="w-10 px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <OrdersTableRow
              key={order.id}
              order={order}
              basePath={basePath}
              isAdmin={isAdmin}
              canShowCreator={canShowCreator}
              onCancelOrder={onCancelOrder}
            />
          ))}
          {!orders.length && <EmptyState isAdmin={isAdmin} canShowCreator={canShowCreator} />}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTableRow({
  order,
  basePath,
  isAdmin,
  canShowCreator,
  onCancelOrder,
}: {
  order: OrderListItem;
  basePath: "/admin/orders" | "/manager/orders";
  isAdmin: boolean;
  canShowCreator: boolean;
  onCancelOrder: (order: OrderListItem) => void;
}) {
  const router = useRouter();
  const status = ORDER_STATUSES[order.status];
  const href = `${basePath}/${order.id}`;
  const date = new Date(order.createdAt);
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  return (
    <tr
      onClick={() => router.push(href)}
      className="group cursor-pointer border-b border-gray-50 transition-colors hover:bg-blue-50/40"
    >
      <td className="px-4 py-3">
        <span className="font-mono text-xs font-semibold text-blue-600 group-hover:underline">
          {order.currentOrderNumber}
        </span>
      </td>
      <td className="max-w-[140px] truncate px-4 py-3 text-xs font-medium text-gray-700">
        {order.customer?.name ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${status?.color ?? "bg-gray-100 text-gray-600"}`}>
          {status?.label ?? order.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
          V{order.version}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-xs tabular-nums text-gray-600">{order._count.items}</td>
      <td className="px-4 py-3 text-right text-xs tabular-nums text-gray-600">{order.totalQty ?? "—"}</td>
      {isAdmin && (
        <td className="px-4 py-3 text-right text-xs tabular-nums font-medium text-red-600">
          {order.totalPurchase != null ? formatCny(order.totalPurchase) : <span className="text-gray-300">—</span>}
        </td>
      )}
      <td className="px-4 py-3 text-right text-xs tabular-nums font-medium text-emerald-600">
        {order.totalSelling != null ? formatCny(order.totalSelling) : <span className="text-gray-300">—</span>}
      </td>
      <td className="max-w-[130px] truncate px-4 py-3 text-xs text-gray-500">
        {order.supplierNames?.length ? order.supplierNames.join(", ") : <span className="text-gray-300">—</span>}
      </td>
      {canShowCreator && (
        <td className="px-4 py-3 text-xs text-gray-500">{order.creator?.name ?? "—"}</td>
      )}
      <td className="px-4 py-3 text-xs tabular-nums text-gray-400">{dateStr}</td>
      <td className="px-4 py-3 text-right">
        {order.status !== "cancelled" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancelOrder(order); }}
            title="Bekor qilish"
            className="rounded p-1 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
          >
            <X size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}

function EmptyState({ isAdmin, canShowCreator }: { isAdmin: boolean; canShowCreator: boolean }) {
  const colSpan = 7 + (isAdmin ? 1 : 0) + (canShowCreator ? 1 : 0) + 1;
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <PackageSearch size={36} strokeWidth={1.2} />
          <p className="text-sm font-medium">Buyurtmalar yo'q</p>
          <p className="text-xs text-gray-300">Filterni o'zgartiring yoki yangi buyurtma yarating</p>
        </div>
      </td>
    </tr>
  );
}

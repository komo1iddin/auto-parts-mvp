"use client";

import { useRouter } from "next/navigation";
import { X, PackageSearch } from "lucide-react";
import type { OrderListItem } from "@/components/orders/types/ordersListTypes";
import { ORDER_STATUSES, cn, formatCny } from "@/lib/utils";

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
    <div className={`overflow-x-hidden transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col className={isAdmin ? "w-[17%]" : "w-[19%]"} />
          <col className={isAdmin ? "w-[14%]" : "w-[16%]"} />
          <col className={isAdmin ? "w-[15%]" : "w-[17%]"} />
          <col className="w-[5%]" />
          {isAdmin && <col className="w-[11%]" />}
          <col className={isAdmin ? "w-[11%]" : "w-[13%]"} />
          <col className={isAdmin ? "w-[12%]" : "w-[15%]"} />
          {canShowCreator && <col className="w-[7%]" />}
          <col className={isAdmin ? "w-[7%]" : "w-[9%]"} />
          <col className="w-[1%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Raqam</th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Mijoz</th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Holat</th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Ver.</th>
            {isAdmin && (
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Xarid</th>
            )}
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Sotuv</th>
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Ta'minotchi</th>
            {canShowCreator && (
              <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Yaratdi</th>
            )}
            <th className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Sana</th>
            <th className="px-1 py-3" />
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
      onMouseEnter={() => router.prefetch(href)}
      onFocus={() => router.prefetch(href)}
      className="group cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
    >
      <td className="px-3 py-3.5 align-middle">
        <span className="block whitespace-nowrap font-mono text-xs font-semibold text-blue-700 group-hover:underline">
          {order.currentOrderNumber}
        </span>
      </td>
      <td className="px-3 py-3.5 text-center align-middle text-xs font-semibold text-slate-700">
        <span className="mx-auto block max-w-full truncate">
          {order.customer?.name ?? <span className="text-slate-400">—</span>}
        </span>
      </td>
      <td className="px-3 py-3.5 text-center align-middle">
        <span className={cn("inline-flex max-w-full items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold", getOrderStatusTone(order.status, status?.color))}>
          {status?.label ?? order.status}
        </span>
      </td>
      <td className="px-3 py-3.5 text-center align-middle">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
          V{order.version}
        </span>
      </td>
      {isAdmin && (
        <td className="px-3 py-3.5 text-center text-xs tabular-nums font-semibold text-red-700">
          {order.totalPurchase != null ? <span className="whitespace-nowrap">{formatCny(order.totalPurchase)}</span> : <span className="text-slate-400">—</span>}
        </td>
      )}
      <td className="px-3 py-3.5 text-center text-xs tabular-nums font-semibold text-emerald-700">
        {order.totalSelling != null ? <span className="whitespace-nowrap">{formatCny(order.totalSelling)}</span> : <span className="text-slate-400">—</span>}
      </td>
      <td className="px-3 py-3.5 text-center align-middle text-xs font-medium text-slate-600">
        <span className="mx-auto block max-w-full truncate">
          {order.supplierNames?.length ? order.supplierNames.join(", ") : <span className="text-slate-400">—</span>}
        </span>
      </td>
      {canShowCreator && (
        <td className="px-3 py-3.5 text-center text-xs font-medium text-slate-600">{order.creator?.name ?? "—"}</td>
      )}
      <td className="px-3 py-3.5 text-center text-xs font-medium tabular-nums text-slate-600">
        <span className="whitespace-nowrap">{dateStr}</span>
      </td>
      <td className="px-1 py-3.5 text-right">
        {order.status !== "cancelled" && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancelOrder(order); }}
            title="Bekor qilish"
            className="rounded p-1 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
          >
            <X size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}

function getOrderStatusTone(status: string, fallback?: string) {
  const tones: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    calculating: "bg-blue-50 text-blue-700",
    confirmed: "bg-emerald-50 text-emerald-700",
    supplier_ordered: "bg-cyan-50 text-cyan-800",
    partially_paid: "bg-amber-50 text-amber-800",
    paid: "bg-emerald-50 text-emerald-800",
    shipped: "bg-indigo-50 text-indigo-700",
    arrived: "bg-violet-50 text-violet-700",
    closed: "bg-slate-200 text-slate-700",
    problem: "bg-red-50 text-red-700",
    updated: "bg-sky-50 text-sky-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return tones[status] ?? fallback ?? "bg-slate-100 text-slate-700";
}

function EmptyState({ isAdmin, canShowCreator }: { isAdmin: boolean; canShowCreator: boolean }) {
  const colSpan = 8 + (isAdmin ? 1 : 0) + (canShowCreator ? 1 : 0);
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <PackageSearch size={36} strokeWidth={1.2} />
          <p className="text-sm font-medium">Buyurtmalar yo'q</p>
          <p className="text-xs text-slate-400">Filterni o'zgartiring yoki yangi buyurtma yarating</p>
        </div>
      </td>
    </tr>
  );
}

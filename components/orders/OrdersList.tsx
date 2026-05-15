"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { OrdersListHeader } from "@/components/orders/list/OrdersListHeader";
import { OrdersListToolbar } from "@/components/orders/list/OrdersListToolbar";
import { OrdersTable } from "@/components/orders/list/OrdersTable";
import type {
  OrderListItem,
  OrdersListProps,
} from "@/components/orders/types/ordersListTypes";

export function OrdersList({
  orders,
  total,
  statusCounts,
  status,
  basePath,
  canShowCreator = false,
}: OrdersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const isAdmin = basePath.startsWith("/admin");
  const filtered = search.trim() ? orders.filter((order) => orderMatchesSearch(order, search)) : orders;

  function setOrderStatus(nextStatus: string) {
    const href = nextStatus ? `${basePath}?status=${nextStatus}` : basePath;
    startTransition(() => router.push(href));
  }

  async function cancelOrder(order: OrderListItem) {
    if (!confirm(`"${order.currentOrderNumber}" buyurtmasini bekor qilishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <OrdersListHeader total={total} isAdmin={isAdmin} basePath={basePath} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <OrdersListToolbar
          status={status}
          statusCounts={statusCounts}
          search={search}
          isPending={isPending}
          onStatusChange={setOrderStatus}
          onSearchChange={setSearch}
        />
        <OrdersTable
          orders={filtered}
          basePath={basePath}
          isAdmin={isAdmin}
          canShowCreator={canShowCreator}
          isPending={isPending}
          onCancelOrder={cancelOrder}
        />
      </div>
    </div>
  );
}

function orderMatchesSearch(order: OrderListItem, search: string) {
  const query = search.toLowerCase();
  return (
    order.currentOrderNumber.toLowerCase().includes(query) ||
    order.customer?.name?.toLowerCase().includes(query) ||
    order.supplierNames?.some((supplier) => supplier?.toLowerCase().includes(query)) ||
    order.creator?.name?.toLowerCase().includes(query)
  );
}

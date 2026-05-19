"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { OrdersListHeader } from "@/components/orders/list/OrdersListHeader";
import { OrdersListToolbar } from "@/components/orders/list/OrdersListToolbar";
import { OrdersTable } from "@/components/orders/list/OrdersTable";
import type {
  OrderListItem,
  OrdersListProps,
} from "@/components/orders/types/ordersListTypes";
import { markLocalMutation } from "@/lib/client/local-mutation";

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
  const [currentStatus, setCurrentStatus] = useState(status);
  const isAdmin = basePath.startsWith("/admin");
  const filtered = useMemo(() => {
    const byStatus = currentStatus ? orders.filter((order) => order.status === currentStatus) : orders;
    return search.trim() ? byStatus.filter((order) => orderMatchesSearch(order, search)) : byStatus;
  }, [orders, currentStatus, search]);

  useEffect(() => {
    function syncStatusFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setCurrentStatus(params.get("status") ?? "");
    }

    syncStatusFromUrl();
    window.addEventListener("popstate", syncStatusFromUrl);
    return () => window.removeEventListener("popstate", syncStatusFromUrl);
  }, []);

  function setOrderStatus(nextStatus: string) {
    setCurrentStatus(nextStatus);
    const href = nextStatus ? `${basePath}?status=${nextStatus}` : basePath;
    window.history.pushState(null, "", href);
  }

  async function cancelOrder(order: OrderListItem) {
    if (!confirm(`"${order.currentOrderNumber}" buyurtmasini bekor qilishni tasdiqlaysizmi?`)) return;
    markLocalMutation();
    await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    markLocalMutation();
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <OrdersListHeader total={total} isAdmin={isAdmin} basePath={basePath} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <OrdersListToolbar
          status={status}
          activeStatus={currentStatus}
          statusCounts={statusCounts}
          search={search}
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

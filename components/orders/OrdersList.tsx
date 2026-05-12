"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ORDER_STATUSES, formatCny } from "@/lib/utils";

interface Order {
  id: string;
  currentOrderNumber: string;
  version: number;
  status: string;
  createdAt: string;
  creator?: { name: string } | null;
  _count: { items: number };
  totalQty?: number;
  totalPurchase?: number;
  totalSelling?: number;
  supplierNames?: (string | null)[];
}

interface OrdersListProps {
  orders: Order[];
  total?: number;
  statusCounts?: Record<string, number>;
  status: string;
  basePath: "/admin/orders" | "/manager/orders";
  canShowCreator?: boolean;
}

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

  const filtered = search.trim()
    ? orders.filter((o) =>
        o.currentOrderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.supplierNames?.some((s) => s?.toLowerCase().includes(search.toLowerCase())) ||
        o.creator?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  function setStatus(nextStatus: string) {
    const href = nextStatus ? `${basePath}?status=${nextStatus}` : basePath;
    startTransition(() => router.push(href));
  }

  async function cancelOrder(id: string, num: string) {
    if (!confirm(`"${num}" buyurtmasini bekor qilishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? "Buyurtmalar" : "Mening buyurtmalarim"}
          </h1>
          {typeof total === "number" && (
            <p className="mt-1 text-sm text-gray-500">Jami: {total} ta</p>
          )}
        </div>
        <Link href={`${basePath}/new`}>
          <Button>Yangi buyurtma</Button>
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex rounded-md bg-muted p-1 flex-wrap gap-0.5">
              {["", "draft", "confirmed", "updated", "cancelled"].map((s) => {
                const count = statusCounts?.[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`h-8 rounded-sm px-3 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      status === s
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "" ? "Barchasi" : ORDER_STATUSES[s]?.label ?? s}
                    {count != null && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                        status === s ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {isPending && <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Raqam, ta'minotchi yoki yaratuvchi bo'yicha qidirish..."
            className="w-full max-w-sm rounded-md border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Raqam</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Holat</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Ver.</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Qismlar</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Miqdor</th>
                {isAdmin && <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Xarid jami</th>}
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Sotuv jami</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Ta'minotchi</th>
                {canShowCreator && (
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Yaratdi</th>
                )}
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Sana</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className={isPending ? "opacity-60" : ""}>
              {filtered.map((order) => {
                const st = ORDER_STATUSES[order.status];
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        prefetch={false}
                        href={`${basePath}/${order.id}`}
                        className="font-mono text-xs font-semibold text-blue-600 hover:underline"
                      >
                        {order.currentOrderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${st?.color ?? ""}`}>
                        {st?.label ?? order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">V{order.version}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{order._count.items}</td>
                    <td className="px-5 py-3 text-xs text-gray-600">{order.totalQty ?? "—"}</td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-xs font-medium text-red-600">
                        {order.totalPurchase != null ? formatCny(order.totalPurchase) : "—"}
                      </td>
                    )}
                    <td className="px-5 py-3 text-xs font-medium text-green-600">
                      {order.totalSelling != null ? formatCny(order.totalSelling) : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 max-w-[120px] truncate">
                      {order.supplierNames?.length ? order.supplierNames.join(", ") : "—"}
                    </td>
                    {canShowCreator && (
                      <td className="px-5 py-3 text-xs text-gray-500">{order.creator?.name ?? "-"}</td>
                    )}
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString("uz")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Link prefetch={false} href={`${basePath}/${order.id}`}>
                          <Button size="sm" variant="ghost">Ko'rish</Button>
                        </Link>
                        {order.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => cancelOrder(order.id, order.currentOrderNumber)}
                          >
                            Bekor
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td
                    colSpan={
                      (isAdmin ? 10 : 9) + (canShowCreator ? 1 : 0)
                    }
                    className="px-5 py-12 text-center text-gray-400"
                  >
                    Buyurtmalar yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

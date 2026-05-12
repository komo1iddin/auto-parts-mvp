"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { ORDER_STATUSES } from "@/lib/utils";

interface Order {
  id: string;
  currentOrderNumber: string;
  version: number;
  status: string;
  createdAt: string;
  creator?: { name: string } | null;
  _count: { items: number };
}

interface OrdersListProps {
  orders: Order[];
  total?: number;
  status: string;
  basePath: "/admin/orders" | "/manager/orders";
  canShowCreator?: boolean;
}

export function OrdersList({
  orders,
  total,
  status,
  basePath,
  canShowCreator = false,
}: OrdersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAdmin = basePath.startsWith("/admin");

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
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div className="inline-flex rounded-md bg-muted p-1">
            {["", "draft", "confirmed", "updated", "cancelled"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`h-8 rounded-sm px-3 text-xs font-medium transition-colors ${
                  status === s
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "" ? "Barchasi" : ORDER_STATUSES[s]?.label ?? s}
              </button>
            ))}
          </div>
          {isPending && <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-medium text-gray-500">Raqam</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Holat</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Ver.</th>
                <th className="px-5 py-3 text-left font-medium text-gray-500">Qismlar</th>
                {canShowCreator && (
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Yaratdi</th>
                )}
                <th className="px-5 py-3 text-left font-medium text-gray-500">Sana</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className={isPending ? "opacity-60" : ""}>
              {orders.map((order) => {
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
                    <td className="px-5 py-3 text-gray-500">V{order.version}</td>
                    <td className="px-5 py-3 text-gray-600">{order._count.items}</td>
                    {canShowCreator && (
                      <td className="px-5 py-3 text-gray-500">{order.creator?.name ?? "-"}</td>
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
              {!orders.length && (
                <tr>
                  <td
                    colSpan={canShowCreator ? 7 : 6}
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

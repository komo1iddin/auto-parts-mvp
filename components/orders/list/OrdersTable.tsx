import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Raqam</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Mijoz</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Holat</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Ver.</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Qismlar</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Miqdor</th>
            {isAdmin && <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Xarid jami</th>}
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Sotuv jami</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Ta'minotchi</th>
            {canShowCreator && <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Yaratdi</th>}
            <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">Sana</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className={isPending ? "opacity-60" : ""}>
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
          {!orders.length && (
            <tr>
              <td
                colSpan={(isAdmin ? 11 : 10) + (canShowCreator ? 1 : 0)}
                className="px-5 py-12 text-center text-gray-400"
              >
                Buyurtmalar yo'q
              </td>
            </tr>
          )}
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
  const status = ORDER_STATUSES[order.status];

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="px-5 py-3">
        <Link
          href={`${basePath}/${order.id}`}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline"
        >
          {order.currentOrderNumber}
        </Link>
      </td>
      <td className="max-w-[140px] truncate px-5 py-3 text-xs font-medium text-gray-700">
        {order.customer?.name ?? "—"}
      </td>
      <td className="px-5 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status?.color ?? ""}`}>
          {status?.label ?? order.status}
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
      <td className="max-w-[120px] truncate px-5 py-3 text-xs text-gray-500">
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
          <Link href={`${basePath}/${order.id}`}>
            <Button size="sm" variant="ghost">Ko'rish</Button>
          </Link>
          {order.status !== "cancelled" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onCancelOrder(order)}
            >
              Bekor
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

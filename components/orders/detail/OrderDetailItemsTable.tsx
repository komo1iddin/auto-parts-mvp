import { OrderPartCodeButton } from "@/components/orders/detail/OrderPartCodeButton";
import type { OrderDetail } from "@/components/orders/types/orderDetailTypes";
import { profitClass, toNumber } from "@/components/orders/detail/orderDetailUtils";
import { PART_TYPES, cn, formatCny } from "@/lib/utils";

interface OrderDetailItemsTableProps {
  order: OrderDetail;
  isAdmin: boolean;
}

export function OrderDetailItemsTable({ order, isAdmin }: OrderDetailItemsTableProps) {
  const duplicateCounts = order.items.reduce((map, item) => {
    map.set(item.partCode, (map.get(item.partCode) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const itemCount = order.items.length;
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPurchase = order.items.reduce((sum, item) => sum + toNumber(item.purchasePriceCny) * item.quantity, 0);
  const totalSelling = order.items.reduce((sum, item) => sum + toNumber(item.sellingPriceCny) * item.quantity, 0);
  const totalProfit = totalSelling - totalPurchase;
  const margin = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-800">Buyurtma qismlari</h2>
          <span className="text-sm text-gray-500">{itemCount} ta qism</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <SummaryValue label="Qismlar" value={itemCount} />
          <SummaryValue label="Miqdor" value={totalQty} />
          {isAdmin && <SummaryValue label="Xarid jami" value={formatCny(totalPurchase)} className="text-red-600" />}
          <SummaryValue label="Sotuv jami" value={formatCny(totalSelling)} className="text-green-600" />
          {isAdmin && <SummaryValue label="Foyda" value={formatCny(totalProfit)} className={profitClass(totalProfit)} />}
          {isAdmin && <SummaryValue label="Margin" value={`${margin.toFixed(1)}%`} className={profitClass(totalProfit)} />}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Kod</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Nomi</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Turi</th>
              {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Xarid (¥)</th>}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Sotuv (¥)</th>
              {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Foyda</th>}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Miqdor</th>
              {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Ta'minotchi</th>}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const count = duplicateCounts.get(item.partCode) ?? 0;
              const itemProfit = (toNumber(item.sellingPriceCny) - toNumber(item.purchasePriceCny)) * item.quantity;
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-left align-middle whitespace-nowrap">
                    <div className="flex items-center justify-start gap-1.5">
                      <OrderPartCodeButton code={item.partCode} isAdmin={isAdmin} />
                      {count > 1 && (
                        <span
                          title={`Bu kod buyurtmada ${count} marta mavjud`}
                          className="shrink-0 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700"
                        >
                          {count}x
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-[160px] truncate px-4 py-2.5 text-center align-middle text-sm text-gray-600">{item.partName || "—"}</td>
                  <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-700">{PART_TYPES[item.type ?? ""] ?? item.type ?? "—"}</td>
                  {isAdmin && <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-700">{formatCny(item.purchasePriceCny?.toString())}</td>}
                  <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-700">{formatCny(item.sellingPriceCny?.toString())}</td>
                  {isAdmin && <td className={cn("px-4 py-2.5 text-center align-middle text-sm font-semibold", profitClass(itemProfit))}>{formatCny(itemProfit)}</td>}
                  <td className="px-4 py-2.5 text-center align-middle text-sm font-semibold text-gray-800">{item.quantity}</td>
                  {isAdmin && <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-600">{item.supplierName ?? "—"}</td>}
                  <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-400">{item.note ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryValue({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="min-w-32 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold text-gray-800", className)}>{value}</div>
    </div>
  );
}

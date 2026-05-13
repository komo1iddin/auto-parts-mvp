import { PackageSearch } from "lucide-react";
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
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
              <PackageSearch className="size-4" />
            </span>
            <h2 className="text-base font-semibold text-gray-950">Buyurtma qismlari</h2>
          </div>
          <span className="text-sm text-gray-500">{itemCount} ta qism</span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryValue label="Qismlar" value={itemCount} tone="neutral" />
          <SummaryValue label="Miqdor" value={totalQty} tone="neutral" />
          {isAdmin && <SummaryValue label="Xarid jami" value={formatCny(totalPurchase)} tone="cost" />}
          <SummaryValue label="Sotuv jami" value={formatCny(totalSelling)} tone="revenue" />
          {isAdmin && <SummaryValue label="Foyda" value={formatCny(totalProfit)} tone={totalProfit >= 0 ? "profit" : "cost"} />}
          {isAdmin && <SummaryValue label="Margin" value={`${margin.toFixed(1)}%`} tone={totalProfit >= 0 ? "margin" : "cost"} />}
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
                      <OrderPartCodeButton item={item} isAdmin={isAdmin} />
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

type SummaryTone = "neutral" | "cost" | "revenue" | "profit" | "margin";

const summaryToneClasses: Record<SummaryTone, { card: string; value: string }> = {
  neutral: {
    card: "border-gray-100 bg-gray-50",
    value: "text-gray-900",
  },
  cost: {
    card: "border-red-100 bg-red-50/70",
    value: "text-red-700",
  },
  revenue: {
    card: "border-blue-100 bg-blue-50/70",
    value: "text-blue-700",
  },
  profit: {
    card: "border-emerald-100 bg-emerald-50/70",
    value: "text-emerald-700",
  },
  margin: {
    card: "border-violet-100 bg-violet-50/70",
    value: "text-violet-700",
  },
};

function SummaryValue({ label, value, tone }: { label: string; value: string | number; tone: SummaryTone }) {
  const classes = summaryToneClasses[tone];
  return (
    <div className={cn("min-w-32 rounded-lg border px-3 py-2.5", classes.card)}>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={cn("mt-1 text-base font-semibold", classes.value)}>{value}</div>
    </div>
  );
}

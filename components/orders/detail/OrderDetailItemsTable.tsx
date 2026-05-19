import { PackageSearch } from "lucide-react";
import { OrderFulfillmentBatchModal } from "@/components/orders/detail/OrderFulfillmentBatchModal";
import { OrderMetric, OrderMetricStrip, OrderSection } from "@/components/orders/detail/OrderSection";
import { OrderPartCodeButton } from "@/components/orders/detail/OrderPartCodeButton";
import type { OrderDetail } from "@/components/orders/types/orderDetailTypes";
import type { OrderFinanceSummary } from "@/lib/order-finance";
import { profitClass, toNumber } from "@/components/orders/detail/orderDetailUtils";
import { PART_TYPES, cn, formatCny } from "@/lib/utils";
import {
  ORDER_ITEM_FULFILLMENT_LABELS,
  ORDER_ITEM_FULFILLMENT_STYLES,
  getFulfillmentStatus,
  getOrderFulfillmentSummary,
} from "@/lib/order-fulfillment";

interface OrderDetailItemsTableProps {
  order: OrderDetail;
  isAdmin: boolean;
  financeSummary?: OrderFinanceSummary;
}

export function OrderDetailItemsTable({ order, isAdmin, financeSummary }: OrderDetailItemsTableProps) {
  const duplicateCounts = order.items.reduce((map, item) => {
    map.set(item.partCode, (map.get(item.partCode) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
  const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPurchase = order.items.reduce((sum, item) => sum + toNumber(item.purchasePriceCny) * item.quantity, 0);
  const totalSelling = order.items.reduce((sum, item) => sum + toNumber(item.sellingPriceCny) * item.quantity, 0);
  const totalProfit = totalSelling - totalPurchase;
  const margin = totalSelling > 0 ? (totalProfit / totalSelling) * 100 : 0;
  const fulfillment = getOrderFulfillmentSummary(order.items);

  return (
    <OrderSection
      icon={<PackageSearch className="size-4" />}
      title="Buyurtma qismlari"
      action={(
        <OrderFulfillmentBatchModal
          orderId={order.id}
          disabled={order.status === "cancelled"}
          items={order.items.map((item) => ({
            id: item.id,
            partCode: item.partCode,
            partName: item.partName,
            quantity: item.quantity,
            shippedQuantity: Math.min(Math.max(0, item.shippedQuantity ?? 0), item.quantity),
          }))}
        />
      )}
    >
        <OrderMetricStrip>
          <OrderMetric label="Miqdor" value={totalQty} />
          <OrderMetric
            label="Chiqqan"
            value={`${fulfillment.shippedQty}/${fulfillment.totalQty}`}
            valueClassName={fulfillment.status === "shipped" ? "text-emerald-700" : fulfillment.status === "partial" ? "text-amber-700" : undefined}
          />
          {isAdmin && <OrderMetric label="Xarid" value={formatCny(totalPurchase)} valueClassName="text-red-700" />}
          <OrderMetric label="Sotuv" value={formatCny(totalSelling)} valueClassName="text-blue-700" />
          {isAdmin && <OrderMetric label="Foyda" value={formatCny(totalProfit)} valueClassName={totalProfit >= 0 ? "text-emerald-700" : "text-red-700"} />}
          {isAdmin && <OrderMetric label="Margin" value={`${margin.toFixed(1)}%`} valueClassName={totalProfit >= 0 ? "text-violet-700" : "text-red-700"} />}
        </OrderMetricStrip>
        {isAdmin && financeSummary && financeSummary.supplierBreakdown.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ta'minotchilar</span>
              {financeSummary.supplierBreakdown.map((supplier) => (
                <span
                  key={supplier.supplierId ?? "no-supplier"}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                    supplier.supplierBalance > 0
                      ? "border-red-100 bg-red-50 text-red-700"
                      : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  )}
                  title={`${supplier.supplierName}: jami ${formatCny(supplier.supplierTotal)}, to'landi ${formatCny(supplier.supplierPaid)}, qarz ${formatCny(supplier.supplierBalance)}`}
                >
                  <span className="max-w-28 truncate text-gray-900">{supplier.supplierName}</span>
                  <span>{supplier.supplierBalance > 0 ? `qarz ${formatCny(supplier.supplierBalance)}` : "to'langan"}</span>
                </span>
              ))}
          </div>
        )}

      <div className="mt-5 overflow-x-auto border-t border-gray-100 pt-0">
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
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Chiqish</th>
              {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Ta'minotchi</th>}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Izoh</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const count = duplicateCounts.get(item.partCode) ?? 0;
              const itemProfit = (toNumber(item.sellingPriceCny) - toNumber(item.purchasePriceCny)) * item.quantity;
              const shippedQuantity = Math.min(Math.max(0, item.shippedQuantity ?? 0), item.quantity);
              const fulfillmentStatus = getFulfillmentStatus(item.quantity, shippedQuantity);
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
                  <td className="px-4 py-2.5 text-center align-middle">
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-100 bg-white px-2.5 py-1 shadow-xs">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", ORDER_ITEM_FULFILLMENT_STYLES[fulfillmentStatus])}>
                        {ORDER_ITEM_FULFILLMENT_LABELS[fulfillmentStatus]}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-gray-900">{shippedQuantity}/{item.quantity}</span>
                    </div>
                  </td>
                  {isAdmin && <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-600">{item.supplierName ?? "—"}</td>}
                  <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-400">{item.note ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </OrderSection>
  );
}

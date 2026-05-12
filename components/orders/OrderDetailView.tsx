import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CancelOrderButton } from "@/components/orders/CancelOrderButton";
import { ExportButtons } from "@/components/orders/ExportButtons";
import { OrderTitleEditor } from "@/components/orders/OrderTitleEditor";
import { ORDER_STATUSES, PART_TYPES, cn, formatCny } from "@/lib/utils";

interface DetailItem {
  id: string;
  partCode: string;
  partName: string | null;
  type: string | null;
  purchasePriceCny?: { toString(): string } | number | string | null;
  sellingPriceCny?: { toString(): string } | number | string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity: number;
  note: string | null;
}

interface Revision {
  id: string;
  version: number;
  newOrderNumber: string;
  changeNote: string | null;
  createdAt: Date | string;
  changer?: { name: string } | null;
}

interface ExportRecord {
  exportType: string;
  language: string;
  createdAt: Date | string;
}

interface OrderDetail {
  id: string;
  currentOrderNumber: string;
  version: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  creator?: { name: string } | null;
  updater?: { name: string } | null;
  items: DetailItem[];
  revisions: Revision[];
}

interface OrderDetailViewProps {
  order: OrderDetail;
  isAdmin: boolean;
  basePath: "/admin/orders" | "/manager/orders";
  exports: ExportRecord[];
}

function toNumber(value: DetailItem["purchasePriceCny"]) {
  if (value == null) return 0;
  return Number(value);
}

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("uz", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function profitClass(value: number) {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
}

function splitChanges(note: string | null) {
  const clean = note?.trim();
  if (!clean) return ["O'zgarish izohi kiritilmagan"];
  return clean.split(";").map((part) => part.trim()).filter(Boolean);
}

function exportLabel(record: ExportRecord | undefined) {
  if (!record) return undefined;
  const type = record.exportType === "supplier"
    ? `${record.language?.toUpperCase() ?? "CN"} Excel`
    : "Ichki Excel";
  return `${type} • ${formatDateTime(record.createdAt)}`;
}

function SummaryValue({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="min-w-32 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={cn("mt-0.5 text-sm font-semibold text-gray-800", className)}>{value}</div>
    </div>
  );
}

export function OrderDetailView({ order, isAdmin, basePath, exports }: OrderDetailViewProps) {
  const st = ORDER_STATUSES[order.status];
  const supplierNames = [...new Set(order.items.map((item) => item.supplierName).filter(Boolean))];
  const supplierIds = [...new Set(order.items.map((item) => item.supplierId).filter(Boolean))] as string[];
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
  const latestExport = [...exports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  const latestExportLabel = exportLabel(latestExport);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <OrderTitleEditor orderId={order.id} title={order.currentOrderNumber} />
              <span className={`inline-flex rounded-full px-3 py-0.5 text-sm font-medium ${st?.color ?? ""}`}>
                {st?.label ?? order.status}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">V{order.version}</span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              {order.status !== "cancelled" && (
                <>
                  <Link href={`${basePath}/${order.id}/edit`} prefetch={false}>
                    <Button variant="secondary">
                      <Pencil className="size-4" />
                      Tahrirlash
                    </Button>
                  </Link>
                  <CancelOrderButton orderId={order.id} orderNumber={order.currentOrderNumber} />
                </>
              )}
            </div>
            {latestExportLabel && <span className="text-xs text-gray-500">Oxirgi export: {latestExportLabel}</span>}
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">Yaratilgan</div>
            <div className="mt-1 font-medium text-gray-800">{formatDateTime(order.createdAt)}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">Oxirgi tahrir</div>
            <div className="mt-1 font-medium text-gray-800">{formatDateTime(order.updatedAt)}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">Yaratdi</div>
            <div className="mt-1 font-medium text-gray-800">{order.creator?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">Tahrirladi</div>
            <div className="mt-1 font-medium text-gray-800">{order.updater?.name ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs font-medium uppercase text-gray-400">Ta'minotchi</div>
            <div className="mt-1 truncate font-medium text-gray-800" title={supplierNames.join(", ")}>
              {supplierNames.length ? supplierNames.join(", ") : "—"}
            </div>
          </div>
        </div>
      </div>

      <ExportButtons orderId={order.id} supplierIds={isAdmin ? supplierIds : []} isAdmin={isAdmin} />

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
                        <span className="text-sm text-gray-800">{item.partCode}</span>
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
                    <td className="max-w-[160px] truncate px-4 py-2.5 text-center align-middle text-sm text-gray-600">
                      {item.partName || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-700">
                      {PART_TYPES[item.type ?? ""] ?? item.type ?? "—"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-700">
                        {formatCny(item.purchasePriceCny?.toString())}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-700">
                      {formatCny(item.sellingPriceCny?.toString())}
                    </td>
                    {isAdmin && (
                      <td className={cn("px-4 py-2.5 text-center align-middle text-sm font-semibold", profitClass(itemProfit))}>
                        {formatCny(itemProfit)}
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-center align-middle text-sm font-semibold text-gray-800">{item.quantity}</td>
                    {isAdmin && (
                      <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-600">{item.supplierName ?? "—"}</td>
                    )}
                    <td className="px-4 py-2.5 text-center align-middle text-sm text-gray-400">{item.note ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Tahrirlash tarixi</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {order.revisions.length ? order.revisions.map((revision) => {
            const changes = splitChanges(revision.changeNote);
            return (
              <article key={revision.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-mono text-sm font-semibold text-gray-900">{revision.newOrderNumber}</h3>
                  <span className="text-sm text-gray-500">V{revision.version}</span>
                  <span className="text-sm text-gray-500">{revision.changer?.name ?? "—"}</span>
                  <span className="text-xs text-gray-400">{formatDateTime(revision.createdAt)}</span>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                  {changes.map((change) => <li key={change}>{change}</li>)}
                </ul>
              </article>
            );
          }) : (
            <p className="px-5 py-8 text-center text-sm text-gray-400">Tahrirlash tarixi yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
}

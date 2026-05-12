import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ORDER_STATUSES, PART_TYPES, formatCny } from "@/lib/utils";
import { ExportButtons } from "@/components/orders/ExportButtons";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { partCode: "asc" } },
      creator: { select: { name: true } },
      updater: { select: { name: true } },
      revisions: {
        orderBy: { version: "desc" },
        include: { changer: { select: { name: true } } },
      },
    },
  });

  if (!order) notFound();

  const st = ORDER_STATUSES[order.status];
  const suppliers = [...new Set(order.items.map((i) => i.supplierId).filter(Boolean))];

  const totalPurchase = order.items.reduce(
    (s, i) => s + Number(i.purchasePriceCny ?? 0) * i.quantity, 0
  );
  const totalSelling = order.items.reduce(
    (s, i) => s + Number(i.sellingPriceCny ?? 0) * i.quantity, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold font-mono text-gray-900">
              {order.currentOrderNumber}
            </h1>
            <span className={`inline-flex rounded-full px-3 py-0.5 text-sm font-medium ${st?.color ?? ""}`}>
              {st?.label ?? order.status}
            </span>
            <span className="text-gray-400 text-sm">V{order.version}</span>
          </div>
          <p className="text-gray-500 text-sm">
            Yaratdi: {order.creator?.name ?? "—"} •{" "}
            {new Date(order.createdAt).toLocaleDateString("uz")}
            {order.updater && ` • Tahrirladi: ${order.updater.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {order.status !== "cancelled" && (
            <Link href={`/admin/orders/${id}/edit`}>
              <button className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200">
                Tahrirlash
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Export buttons */}
      <ExportButtons orderId={order.id} supplierIds={suppliers as string[]} />

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Qismlar ro'yxati ({order.items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">№</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Kod</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nomi</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Kategoriya</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Brend</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Turi</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Miqdor</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Xarid (¥)</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Sotuv (¥)</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Ta'minotchi</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Izoh</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-800">{item.partCode}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-xs">{item.partName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{item.categoryName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{item.brand ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                      {PART_TYPES[item.type ?? ""] ?? item.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-xs">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-xs">{formatCny(item.purchasePriceCny?.toString())}</td>
                  <td className="px-4 py-2.5 text-xs">{formatCny(item.sellingPriceCny?.toString())}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{item.supplierName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{item.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-6 text-sm">
          <span>Jami miqdor: <strong>{order.items.reduce((s, i) => s + i.quantity, 0)}</strong></span>
          <span>Xarid jami: <strong className="text-red-600">{formatCny(totalPurchase)}</strong></span>
          <span>Sotuv jami: <strong className="text-green-600">{formatCny(totalSelling)}</strong></span>
        </div>
      </div>

      {/* Revision history */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Tahrirlash tarixi</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Ver.</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Raqam</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Kim</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Izoh</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Sana</th>
            </tr>
          </thead>
          <tbody>
            {order.revisions.map((r) => (
              <tr key={r.id} className="border-b border-gray-50">
                <td className="px-5 py-2.5 text-gray-500">V{r.version}</td>
                <td className="px-5 py-2.5 font-mono text-xs">{r.newOrderNumber}</td>
                <td className="px-5 py-2.5 text-gray-600">{r.changer?.name ?? "—"}</td>
                <td className="px-5 py-2.5 text-gray-500">{r.changeNote ?? "—"}</td>
                <td className="px-5 py-2.5 text-gray-400 text-xs">
                  {new Date(r.createdAt).toLocaleString("uz")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

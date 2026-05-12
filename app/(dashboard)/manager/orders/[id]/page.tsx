import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ORDER_STATUSES, PART_TYPES, formatCny } from "@/lib/utils";
import { ExportButtons } from "@/components/orders/ExportButtons";

export default async function ManagerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { partCode: "asc" } },
      creator: { select: { name: true } },
      revisions: { orderBy: { version: "desc" } },
    },
  });

  if (!order) notFound();
  if (order.createdBy !== user?.id) redirect("/manager/orders");

  const st = ORDER_STATUSES[order.status];

  const totalSelling = order.items.reduce(
    (s, i) => s + Number(i.sellingPriceCny ?? 0) * i.quantity, 0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold font-mono text-gray-900">{order.currentOrderNumber}</h1>
            <span className={`inline-flex rounded-full px-3 py-0.5 text-sm font-medium ${st?.color ?? ""}`}>
              {st?.label ?? order.status}
            </span>
            <span className="text-gray-400 text-sm">V{order.version}</span>
          </div>
          <p className="text-gray-500 text-sm">{new Date(order.createdAt).toLocaleDateString("uz")}</p>
        </div>
        {order.status !== "cancelled" && (
          <Link href={`/manager/orders/${id}/edit`}>
            <button className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200">
              Tahrirlash
            </button>
          </Link>
        )}
      </div>

      <ExportButtons orderId={order.id} supplierIds={[]} isAdmin={false} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Qismlar ({order.items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium">№</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Kod</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Nomi</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Brend</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Turi</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Miqdor</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Sotuv (¥)</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium">Izoh</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold">{item.partCode}</td>
                  <td className="px-4 py-2.5 text-gray-700 text-xs">{item.partName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-gray-500 text-xs">{item.brand ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className="bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">
                      {PART_TYPES[item.type ?? ""] ?? item.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-xs">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-xs">{formatCny(item.sellingPriceCny?.toString())}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{item.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-sm">
          <span>Sotuv jami: <strong className="text-green-600">{formatCny(totalSelling)}</strong></span>
        </div>
      </div>
    </div>
  );
}

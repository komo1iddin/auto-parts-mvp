import { getAuthUser } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/data";
import Link from "next/link";

export default async function ManagerDashboard() {
  const user = await getAuthUser();
  const { myOrdersCount, draftCount, recentOrders } =
    await getManagerDashboardData(user!.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Xush kelibsiz, {user?.name}
      </h1>
      <p className="text-gray-500 text-sm mb-6">Menejer paneli</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/manager/orders" className="bg-blue-50 text-blue-700 rounded-xl p-5 hover:opacity-80">
          <div className="text-3xl font-bold">{myOrdersCount}</div>
          <div className="text-sm font-medium mt-1">Mening buyurtmalarim</div>
        </Link>
        <Link href="/manager/orders?status=draft" className="bg-yellow-50 text-yellow-700 rounded-xl p-5 hover:opacity-80">
          <div className="text-3xl font-bold">{draftCount}</div>
          <div className="text-sm font-medium mt-1">Qoralamalar</div>
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href="/manager/orders/new"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
        >
          + Yangi buyurtma
        </Link>
        <Link
          href="/manager/parts"
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200"
        >
          Qismlarni qidirish
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">So'nggi buyurtmalar</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Raqam</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Holat</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Qismlar</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Sana</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/manager/orders/${order.id}`} className="text-blue-600 hover:underline font-mono text-xs">
                    {order.currentOrderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3 text-gray-600">{order._count.items}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">
                  {new Date(order.createdAt).toLocaleDateString("uz")}
                </td>
              </tr>
            ))}
            {!recentOrders.length && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                  Buyurtmalar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    confirmed: "bg-green-100 text-green-700",
    updated: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    draft: "Qoralama", confirmed: "Tasdiqlangan", updated: "Yangilangan", cancelled: "Bekor",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}

import Link from "next/link";
import { ClipboardList, PackageSearch, Users, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAdminDashboardData } from "@/lib/data";

export default async function AdminDashboard() {
  const { partsCount, ordersCount, suppliersCount, usersCount, recentOrders } =
    await getAdminDashboardData();

  const stats = [
    { label: "Qismlar", value: partsCount, href: "/admin/parts", icon: PackageSearch },
    { label: "Buyurtmalar", value: ordersCount, href: "/admin/orders", icon: ClipboardList },
    { label: "Ta'minotchilar", value: suppliersCount, href: "/admin/suppliers", icon: Warehouse },
    { label: "Foydalanuvchilar", value: usersCount, href: "/admin/users", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ombor, buyurtmalar va foydalanuvchilar bo'yicha qisqa holat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border bg-card p-5 text-card-foreground shadow-xs transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
              <s.icon className="size-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</div>
          </Link>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>So'nggi buyurtmalar</CardTitle>
          <Link href="/admin/orders" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Barchasini ko'rish
          </Link>
        </CardHeader>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-5 py-3 text-muted-foreground font-medium">Raqam</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium">Holat</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium">Yaratdi</th>
              <th className="text-left px-5 py-3 text-muted-foreground font-medium">Qismlar</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-muted/50">
                <td className="px-5 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-medium hover:underline">
                    {order.currentOrderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-5 py-3 text-muted-foreground">{order.creator?.name ?? "—"}</td>
                <td className="px-5 py-3 text-muted-foreground">{order._count.items}</td>
              </tr>
            ))}
            {!recentOrders.length && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Buyurtmalar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
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
    draft: "Qoralama",
    confirmed: "Tasdiqlangan",
    updated: "Yangilangan",
    cancelled: "Bekor",
  };
  return (
    <Badge className={map[status] ?? ""}>
      {labels[status] ?? status}
    </Badge>
  );
}

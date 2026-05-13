import { getAuthUser } from "@/lib/auth";
import { getManagerDashboardData } from "@/lib/data";
import { CLIENT_STATUS_LABELS } from "@/components/orders/finance/orderFinanceUtils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn, formatCny, ORDER_STATUSES } from "@/lib/utils";
import { ArrowRight, ClipboardList, PackageSearch, Wallet } from "lucide-react";
import Link from "next/link";

export default async function ManagerDashboard() {
  const user = await getAuthUser();
  const { myOrdersCount, draftCount, financeTotals, recentOrders } =
    await getManagerDashboardData(user!.id);

  const stats = [
    {
      label: "Mening buyurtmalarim",
      value: myOrdersCount,
      subtitle: `${financeTotals.openOrdersCount} ta yopilmagan`,
      href: "/manager/orders",
      icon: ClipboardList,
      tone: "text-blue-700",
    },
    {
      label: "Qoralamalar",
      value: draftCount,
      subtitle: "Hisoblanayotgan zakazlar",
      href: "/manager/orders?status=draft",
      icon: ClipboardList,
      tone: "text-amber-700",
    },
    {
      label: "Jami sotuv",
      value: formatCny(financeTotals.clientTotal),
      subtitle: `${formatCny(financeTotals.clientPaid)} to'langan`,
      href: "/manager/orders",
      icon: Wallet,
      tone: "text-green-700",
    },
    {
      label: "Mijoz qarzi",
      value: formatCny(financeTotals.clientBalance),
      subtitle: "Mijozlardan olinishi kerak",
      href: "/manager/orders",
      icon: Wallet,
      tone: financeTotals.clientBalance > 0 ? "text-red-700" : "text-green-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Xush kelibsiz, {user?.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyurtmalar, to'lovlar va yopilmagan zakazlar bo'yicha umumiy nazorat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border bg-card p-5 text-card-foreground shadow-xs transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
              <stat.icon className={cn("size-4", stat.tone)} />
            </div>
            <div className={cn("mt-3 text-2xl font-semibold tracking-tight", stat.tone)}>{stat.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-semibold">{financeTotals.orderStatusCounts.calculating ?? 0}</div>
          <div className="mt-1 text-xs text-muted-foreground">Hisoblanmoqda</div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-semibold">{financeTotals.orderStatusCounts.supplier_ordered ?? 0}</div>
          <div className="mt-1 text-xs text-muted-foreground">Ta'minotchiga berildi</div>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3">
          <div className="text-2xl font-semibold">{financeTotals.orderStatusCounts.problem ?? 0}</div>
          <div className="mt-1 text-xs text-muted-foreground">Muammoli</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/manager/orders/new"
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Yangi buyurtma
        </Link>
        <Link
          href="/manager/parts"
          className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          <PackageSearch className="size-4" />
          Qismlarni qidirish
        </Link>
        <Link
          href="/manager/orders"
          className="inline-flex h-9 items-center gap-2 rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
        >
          Barcha buyurtmalar
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>So'nggi buyurtmalar</CardTitle>
          <Link
            href="/manager/orders"
            className="inline-flex h-8 items-center gap-1 rounded-md border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            Barcha buyurtmalar
            <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Raqam</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Holat</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Qismlar</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Sotuv</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">To'langan</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Qoldiq</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Sana</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/50">
                  <td className="px-5 py-3">
                    <Link href={`/manager/orders/${order.id}`} className="font-mono text-xs font-medium text-blue-600 hover:underline">
                      {order.currentOrderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={order.status} />
                      <PaymentBadge status={order.finance.clientPaymentStatus} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{order._count.items}</td>
                  <td className="px-5 py-3 font-medium text-green-700">{formatCny(order.finance.clientTotal)}</td>
                  <td className="px-5 py-3 font-medium">{formatCny(order.finance.clientPaid)}</td>
                  <td className={cn("px-5 py-3 font-medium", order.finance.clientBalance > 0 ? "text-red-700" : "text-green-700")}>
                    {formatCny(order.finance.clientBalance)}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("uz")}
                  </td>
                </tr>
              ))}
              {!recentOrders.length && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                    Buyurtmalar yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusMeta = ORDER_STATUSES[status];
  return (
    <Badge className={statusMeta?.color ?? ""}>
      {statusMeta?.label ?? status}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: keyof typeof CLIENT_STATUS_LABELS }) {
  const map = {
    unpaid: "bg-red-100 text-red-700",
    partially_paid: "bg-amber-100 text-amber-700",
    paid: "bg-green-100 text-green-700",
    overpaid: "bg-violet-100 text-violet-700",
  };
  return <Badge className={map[status]}>{CLIENT_STATUS_LABELS[status]}</Badge>;
}

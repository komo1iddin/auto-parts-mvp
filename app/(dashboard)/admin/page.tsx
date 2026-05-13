import Link from "next/link";
import { ArrowRight, Banknote, ClipboardList, PackageSearch, TrendingUp, Users, Wallet, Warehouse } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { getAdminDashboardData } from "@/lib/data";
import { cn, formatCny, ORDER_STATUSES } from "@/lib/utils";
import { CLIENT_STATUS_LABELS, FINANCE_STATUS_LABELS } from "@/components/orders/finance/orderFinanceUtils";

export default async function AdminDashboard() {
  const { partsCount, ordersCount, suppliersCount, usersCount, financeTotals, recentOrders } =
    await getAdminDashboardData();

  const primaryStats = [
    {
      label: "Buyurtmalar",
      value: ordersCount,
      subtitle: `${financeTotals.openOrdersCount} ta yopilmagan`,
      href: "/admin/orders",
      icon: ClipboardList,
      tone: "text-blue-700",
    },
    {
      label: "Jami sotuv",
      value: formatCny(financeTotals.clientTotal),
      subtitle: `${formatCny(financeTotals.clientPaid)} to'langan`,
      href: "/admin/orders",
      icon: Wallet,
      tone: "text-green-700",
    },
    {
      label: "Jami kirim",
      value: formatCny(financeTotals.supplierTotal),
      subtitle: `${formatCny(financeTotals.supplierPaid)} to'langan`,
      href: "/admin/suppliers",
      icon: Banknote,
      tone: "text-red-700",
    },
    {
      label: "Foyda",
      value: formatCny(financeTotals.expectedGrossProfit),
      subtitle: `${formatCny(financeTotals.clientBalance)} mijoz qarzi`,
      href: "/admin/orders",
      icon: TrendingUp,
      tone: financeTotals.expectedGrossProfit >= 0 ? "text-emerald-700" : "text-red-700",
    },
    {
      label: "Qolgan to'lov",
      value: formatCny(financeTotals.clientBalance),
      subtitle: `${financeTotals.clientBalanceOrdersCount} ta buyurtmada`,
      href: "/admin/orders",
      icon: Banknote,
      tone: financeTotals.clientBalance > 0 ? "text-amber-700" : "text-green-700",
    },
  ];

  const secondaryStats = [
    { label: "Qismlar", value: partsCount, href: "/admin/parts", icon: PackageSearch },
    { label: "Ta'minotchilar", value: suppliersCount, href: "/admin/suppliers", icon: Warehouse },
    { label: "Foydalanuvchilar", value: usersCount, href: "/admin/users", icon: Users },
    {
      label: "Supplier qarzi",
      value: formatCny(financeTotals.supplierBalance),
      href: "/admin/suppliers",
      icon: Banknote,
    },
  ];

  const statusCards = [
    { label: "Hisoblanmoqda", value: financeTotals.orderStatusCounts.calculating ?? 0 },
    { label: "Tasdiqlangan", value: financeTotals.orderStatusCounts.confirmed ?? 0 },
    { label: "Ta'minotchiga berildi", value: financeTotals.orderStatusCounts.supplier_ordered ?? 0 },
    { label: "Yetkazib berishda", value: financeTotals.orderStatusCounts.shipped ?? 0 },
    { label: "Muammoli", value: financeTotals.orderStatusCounts.problem ?? 0 },
  ];

  const paymentStatusCards = [
    { label: "Mijoz to'lovi kutilmoqda", value: financeTotals.financeStatusCounts.waiting_client_payment },
    { label: "Qisman to'langan", value: financeTotals.financeStatusCounts.client_partially_paid },
    { label: "Supplierga to'lash kerak", value: financeTotals.financeStatusCounts.ready_to_pay_supplier },
    { label: "Yopilgan", value: financeTotals.financeStatusCounts.closed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyurtmalar, ombor, to'lovlar va ta'minotchilar bo'yicha umumiy nazorat.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {primaryStats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-lg border bg-card p-5 text-card-foreground shadow-xs transition-colors hover:bg-accent"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">{s.label}</div>
              <s.icon className={cn("size-4", s.tone)} />
            </div>
            <div className={cn("mt-3 text-2xl font-semibold tracking-tight", s.tone)}>{s.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.subtitle}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm shadow-xs transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <s.icon className="size-4" />
              {s.label}
            </span>
            <span className="font-semibold text-foreground">{s.value}</span>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zakaz workflow nazorati</CardTitle>
        </CardHeader>
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-5">
          {statusCards.map((status) => (
            <div key={status.label} className="border-b px-5 py-4 last:border-b-0 sm:border-r lg:border-b-0">
              <div className="text-2xl font-semibold">{status.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{status.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {paymentStatusCards.map((status) => (
          <div key={status.label} className="rounded-lg border bg-card px-4 py-3 shadow-xs">
            <div className="text-2xl font-semibold">{status.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{status.label}</div>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>So'nggi buyurtmalar</CardTitle>
          <Link
            href="/admin/orders"
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
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Yaratdi</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Holat</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Qismlar</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Sotuv</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Kirim</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Foyda</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">To'lov</th>
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
                  <td className="px-5 py-3 text-muted-foreground">{order.creator?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={order.status} />
                      <FinanceStatusBadge status={order.finance.orderFinanceStatus} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{order._count.items}</td>
                  <td className="px-5 py-3 font-medium text-green-700">{formatCny(order.finance.clientTotal)}</td>
                  <td className="px-5 py-3 font-medium text-red-700">{formatCny(order.finance.supplierTotal)}</td>
                  <td className={cn("px-5 py-3 font-medium", order.finance.expectedGrossProfit >= 0 ? "text-emerald-700" : "text-red-700")}>
                    {formatCny(order.finance.expectedGrossProfit)}
                  </td>
                  <td className="px-5 py-3">
                    <PaymentBadge status={order.finance.clientPaymentStatus} />
                  </td>
                </tr>
              ))}
              {!recentOrders.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-muted-foreground">
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
    overpaid: "bg-blue-100 text-blue-700",
  };
  return <Badge className={map[status]}>{CLIENT_STATUS_LABELS[status]}</Badge>;
}

function FinanceStatusBadge({ status }: { status: keyof typeof FINANCE_STATUS_LABELS }) {
  const map = {
    waiting_client_payment: "bg-red-50 text-red-700",
    client_partially_paid: "bg-amber-50 text-amber-700",
    ready_to_pay_supplier: "bg-blue-50 text-blue-700",
    supplier_partially_paid: "bg-amber-50 text-amber-700",
    supplier_paid: "bg-emerald-50 text-emerald-700",
    closed: "bg-gray-100 text-gray-700",
  };
  return <Badge className={map[status]}>{FINANCE_STATUS_LABELS[status]}</Badge>;
}

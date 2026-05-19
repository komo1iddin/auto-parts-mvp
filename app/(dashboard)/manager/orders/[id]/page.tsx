import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { OrderFinancePanel } from "@/components/orders/finance/OrderFinancePanel";
import { calculateOrderFinance } from "@/lib/order-finance";
import { getOrderDetailFast } from "@/lib/order-detail-query";

export default async function ManagerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();

  const order = await getOrderDetailFast(id);

  if (!order) notFound();
  if (order.createdBy !== user?.id) redirect("/manager/orders");

  const clientPayments = order.clientPayments ?? [];
  const finance = calculateOrderFinance(order.items ?? [], clientPayments, []);
  const clientFinance = {
    ...finance,
    supplierTotal: 0,
    expectedGrossProfit: 0,
    profitWithdrawn: 0,
    profitBalance: 0,
    supplierPaid: 0,
    supplierBalance: 0,
    cashDifference: 0,
    supplierBreakdown: [],
  };

  return (
    <OrderDetailView
      order={order}
      exports={order.exports ?? []}
      isAdmin={false}
      basePath="/manager/orders"
      financeSummary={clientFinance}
      financePanel={
        <OrderFinancePanel
          orderId={order.id}
          orderNumber={order.currentOrderNumber}
          financePath={`/manager/orders/${order.id}/finance`}
          isAdmin={false}
          canManageClientPayments={Boolean(user?.canCreateClientPayments)}
          summary={clientFinance}
          clientPayments={clientPayments.map((payment) => ({
            ...payment,
            amountCny: payment.amountCny.toString(),
            paymentDate: toIsoString(payment.paymentDate),
            createdAt: toIsoString(payment.createdAt),
          }))}
          supplierPayments={[]}
          profitWithdrawals={[]}
          suppliers={[]}
        />
      }
    />
  );
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

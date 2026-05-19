import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { OrderFinancePanel } from "@/components/orders/finance/OrderFinancePanel";
import { calculateOrderFinance } from "@/lib/order-finance";
import { getOrderDetailFast } from "@/lib/order-detail-query";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await getOrderDetailFast(id);

  if (!order) notFound();

  const clientPayments = order.clientPayments ?? [];
  const supplierPayments = order.supplierPayments ?? [];
  const profitWithdrawals = order.profitWithdrawals ?? [];
  const finance = calculateOrderFinance(order.items ?? [], clientPayments, supplierPayments, profitWithdrawals);
  const orderSuppliers = finance.supplierBreakdown
    .filter((supplier): supplier is typeof supplier & { supplierId: string } => Boolean(supplier.supplierId))
    .map((supplier) => ({ id: supplier.supplierId, name: supplier.supplierName }));

  return (
    <OrderDetailView
      order={order}
      exports={order.exports ?? []}
      isAdmin={true}
      basePath="/admin/orders"
      financeSummary={finance}
      financePanel={
        <OrderFinancePanel
          orderId={order.id}
          orderNumber={order.currentOrderNumber}
          financePath={`/admin/orders/${order.id}/finance`}
          isAdmin={true}
          canManageClientPayments={true}
          summary={finance}
          clientPayments={clientPayments.map((payment) => ({
            ...payment,
            amountCny: payment.amountCny.toString(),
            paymentDate: toIsoString(payment.paymentDate),
            createdAt: toIsoString(payment.createdAt),
          }))}
          supplierPayments={supplierPayments.map((payment) => ({
            ...payment,
            amountCny: payment.amountCny.toString(),
            paymentDate: toIsoString(payment.paymentDate),
            createdAt: toIsoString(payment.createdAt),
          }))}
          profitWithdrawals={profitWithdrawals.map((payment) => ({
            ...payment,
            amountCny: payment.amountCny.toString(),
            paymentDate: toIsoString(payment.paymentDate),
            createdAt: toIsoString(payment.createdAt),
          }))}
          suppliers={orderSuppliers}
        />
      }
    />
  );
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

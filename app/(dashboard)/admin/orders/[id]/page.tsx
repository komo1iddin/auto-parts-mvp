import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { OrderFinancePanel } from "@/components/orders/finance/OrderFinancePanel";
import { calculateOrderFinance } from "@/lib/order-finance";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order, exports] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: {
        items: { orderBy: { partCode: "asc" } },
        creator: { select: { name: true } },
        updater: { select: { name: true } },
        customer: { select: { name: true } },
        revisions: {
          orderBy: { version: "desc" },
          include: { changer: { select: { name: true } } },
        },
        clientPayments: {
          orderBy: { paymentDate: "desc" },
          include: { creator: { select: { name: true } } },
        },
        supplierPayments: {
          orderBy: { paymentDate: "desc" },
          include: {
            creator: { select: { name: true } },
            supplier: { select: { name: true } },
          },
        },
        profitWithdrawals: {
          orderBy: { paymentDate: "desc" },
          include: { creator: { select: { name: true } } },
        },
      },
    }),
    prisma.orderExport.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
      exports={exports}
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
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
          }))}
          supplierPayments={supplierPayments.map((payment) => ({
            ...payment,
            amountCny: payment.amountCny.toString(),
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
          }))}
          profitWithdrawals={profitWithdrawals.map((payment) => ({
            ...payment,
            amountCny: payment.amountCny.toString(),
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
          }))}
          suppliers={orderSuppliers}
        />
      }
    />
  );
}

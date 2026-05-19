import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { OrderFinancePanel } from "@/components/orders/finance/OrderFinancePanel";
import { calculateOrderFinance } from "@/lib/order-finance";

export default async function ManagerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();

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
      },
    }),
    prisma.orderExport.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
      exports={exports}
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
            paymentDate: payment.paymentDate.toISOString(),
            createdAt: payment.createdAt.toISOString(),
          }))}
          supplierPayments={[]}
          profitWithdrawals={[]}
          suppliers={[]}
        />
      }
    />
  );
}

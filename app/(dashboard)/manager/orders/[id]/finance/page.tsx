import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { OrderFinancePage } from "@/components/orders/OrderFinancePage";
import { calculateOrderFinance } from "@/lib/order-finance";

export default async function ManagerOrderFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      currentOrderNumber: true,
      createdBy: true,
      items: { orderBy: { partCode: "asc" } },
      clientPayments: {
        orderBy: { paymentDate: "desc" },
        include: { creator: { select: { name: true } } },
      },
    },
  });

  if (!order) notFound();
  if (order.createdBy !== user?.id) redirect("/manager/orders");

  const clientPayments = order.clientPayments ?? [];
  const finance = calculateOrderFinance(order.items ?? [], clientPayments, []);
  const clientFinance = {
    ...finance,
    supplierTotal: 0,
    expectedGrossProfit: 0,
    supplierPaid: 0,
    supplierBalance: 0,
    cashDifference: 0,
    supplierBreakdown: [],
  };

  return (
    <OrderFinancePage
      orderId={order.id}
      orderNumber={order.currentOrderNumber}
      backPath={`/manager/orders/${order.id}`}
      isAdmin={false}
      canManageClientPayments={Boolean(user?.canCreateClientPayments)}
      summary={clientFinance}
      clientPayments={clientPayments.map((p) => ({
        ...p,
        amountCny: p.amountCny.toString(),
        paymentDate: p.paymentDate.toISOString(),
        createdAt: p.createdAt.toISOString(),
      }))}
      supplierPayments={[]}
      suppliers={[]}
    />
  );
}

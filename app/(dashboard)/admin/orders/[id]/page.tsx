import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OrderDetailView } from "@/components/orders/OrderDetailView";
import { OrderFinancePanel } from "@/components/orders/OrderFinancePanel";
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
  const finance = calculateOrderFinance(order.items ?? [], clientPayments, supplierPayments);
  const suppliers = finance.supplierBreakdown
    .filter((supplier) => supplier.supplierId)
    .map((supplier) => ({ id: supplier.supplierId!, name: supplier.supplierName }));

  return (
    <OrderDetailView
      order={order}
      exports={exports}
      isAdmin={true}
      basePath="/admin/orders"
      financePanel={
        <OrderFinancePanel
          orderId={order.id}
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
          suppliers={suppliers}
        />
      }
    />
  );
}

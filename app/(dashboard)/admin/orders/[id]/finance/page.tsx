import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OrderFinancePage } from "@/components/orders/OrderFinancePage";
import { calculateOrderFinance } from "@/lib/order-finance";

export default async function AdminOrderFinancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order, allSuppliers] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        currentOrderNumber: true,
        items: { orderBy: { partCode: "asc" } },
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
    prisma.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) notFound();

  const clientPayments = order.clientPayments ?? [];
  const supplierPayments = order.supplierPayments ?? [];
  const finance = calculateOrderFinance(order.items ?? [], clientPayments, supplierPayments);

  return (
    <OrderFinancePage
      orderId={order.id}
      orderNumber={order.currentOrderNumber}
      backPath={`/admin/orders/${order.id}`}
      isAdmin={true}
      canManageClientPayments={true}
      summary={finance}
      clientPayments={clientPayments.map((p) => ({
        ...p,
        amountCny: p.amountCny.toString(),
        paymentDate: p.paymentDate.toISOString(),
        createdAt: p.createdAt.toISOString(),
      }))}
      supplierPayments={supplierPayments.map((p) => ({
        ...p,
        amountCny: p.amountCny.toString(),
        paymentDate: p.paymentDate.toISOString(),
        createdAt: p.createdAt.toISOString(),
      }))}
      suppliers={allSuppliers}
    />
  );
}

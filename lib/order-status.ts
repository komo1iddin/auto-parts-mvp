import { calculateOrderFinance } from "@/lib/order-finance";
import { prisma } from "@/lib/prisma";

const PAYMENT_SYNC_STATUSES = new Set(["draft", "calculating", "confirmed", "partially_paid", "paid"]);

export async function syncOrderClientPaymentStatus(orderId: string, updatedBy?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      items: {
        select: {
          supplierId: true,
          supplierName: true,
          quantity: true,
          purchasePriceCny: true,
          sellingPriceCny: true,
        },
      },
      clientPayments: { select: { amountCny: true } },
      supplierPayments: { select: { supplierId: true, amountCny: true } },
    },
  });

  if (!order || !PAYMENT_SYNC_STATUSES.has(order.status)) return;

  const finance = calculateOrderFinance(order.items, order.clientPayments, order.supplierPayments);
  const nextStatus =
    finance.clientPaymentStatus === "paid" || finance.clientPaymentStatus === "overpaid"
      ? "paid"
      : finance.clientPaymentStatus === "partially_paid"
        ? "partially_paid"
        : order.status === "paid" || order.status === "partially_paid"
          ? "confirmed"
          : order.status;

  if (nextStatus === order.status) return;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      ...(updatedBy ? { updatedBy } : {}),
    },
  });
}

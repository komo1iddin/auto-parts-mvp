import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAuth, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { calculateOrderFinance, PAYMENT_METHODS } from "@/lib/order-finance";

function isValidMethod(method: string) {
  return PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number]);
}

async function getWithdrawal(orderId: string, withdrawalId: string) {
  const withdrawal = await prisma.profitWithdrawal.findUnique({ where: { id: withdrawalId } });
  if (!withdrawal || withdrawal.orderId !== orderId) return null;
  return withdrawal;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; withdrawalId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return unauthorized();
  }
  if (user.role !== "admin") return forbidden();

  const { id, withdrawalId } = await params;
  const existing = await getWithdrawal(id, withdrawalId);
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });

  const { amountCny, paymentDate, paymentMethod, note } = await req.json();
  const amount = Number(amountCny);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "To'lov miqdori noto'g'ri" }, { status: 400 });
  }
  if (!paymentDate || Number.isNaN(new Date(paymentDate).getTime())) {
    return Response.json({ error: "To'lov sanasi noto'g'ri" }, { status: 400 });
  }
  if (!isValidMethod(paymentMethod)) {
    return Response.json({ error: "To'lov usuli noto'g'ri" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      clientPayments: true,
      supplierPayments: true,
      profitWithdrawals: true,
    },
  });
  if (!order) return Response.json({ error: "Topilmadi" }, { status: 404 });

  const otherWithdrawals = order.profitWithdrawals.filter((payment: { id: string }) => payment.id !== withdrawalId);
  const finance = calculateOrderFinance(order.items, order.clientPayments, order.supplierPayments, otherWithdrawals);
  const availableProfit = Math.max(0, Math.min(finance.cashDifference, finance.profitBalance));
  if (amount > availableProfit) {
    return Response.json(
      { error: `Olish mumkin bo'lgan foyda yetarli emas. Mavjud: ${availableProfit}` },
      { status: 400 }
    );
  }

  const withdrawal = await prisma.profitWithdrawal.update({
    where: { id: withdrawalId },
    data: {
      amountCny: amount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      note: note?.trim() || null,
    },
  });

  revalidateAppData("orders");
  return Response.json({ withdrawal });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; withdrawalId: string }> }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "admin") return forbidden();
  } catch {
    return unauthorized();
  }

  const { id, withdrawalId } = await params;
  const existing = await getWithdrawal(id, withdrawalId);
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });

  await prisma.profitWithdrawal.delete({ where: { id: withdrawalId } });

  revalidateAppData("orders");
  return Response.json({ ok: true });
}

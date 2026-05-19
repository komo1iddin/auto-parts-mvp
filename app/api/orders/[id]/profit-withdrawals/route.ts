import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAuth, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { calculateOrderFinance, PAYMENT_METHODS } from "@/lib/order-finance";

function isValidMethod(method: string) {
  return PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number]);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return unauthorized();
  }
  if (user.role !== "admin") return forbidden();

  const { id } = await params;
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

  const finance = calculateOrderFinance(order.items, order.clientPayments, order.supplierPayments, order.profitWithdrawals);
  const availableProfit = Math.max(0, Math.min(finance.cashDifference, finance.profitBalance));
  if (amount > availableProfit) {
    return Response.json(
      { error: `Olish mumkin bo'lgan foyda yetarli emas. Mavjud: ${availableProfit}` },
      { status: 400 }
    );
  }

  let withdrawal;
  try {
    withdrawal = await prisma.profitWithdrawal.create({
      data: {
        orderId: id,
        amountCny: amount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        note: note?.trim() || null,
        createdBy: user.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("profit_withdrawals") || message.includes("Could not find the table")) {
      return Response.json({ error: "profit_withdrawals jadvali hali bazaga qo'llanmagan" }, { status: 500 });
    }
    throw error;
  }

  revalidateAppData("orders");
  return Response.json({ withdrawal }, { status: 201 });
}

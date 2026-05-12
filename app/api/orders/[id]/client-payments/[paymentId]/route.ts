import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/order-finance";

function isValidMethod(method: string) {
  return PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number]);
}

async function getPayment(orderId: string, paymentId: string, user: { id: string; role: string }) {
  const payment = await prisma.clientPayment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { id: true, createdBy: true } } },
  });
  if (!payment || payment.orderId !== orderId) return null;
  if (user.role === "manager" && payment.order.createdBy !== user.id) return undefined;
  return payment;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  if (user.role !== "admin") return forbidden("Faqat admin to'lovni tahrirlay oladi");

  const { id, paymentId } = await params;
  const existing = await getPayment(id, paymentId, user);
  if (existing === null) return Response.json({ error: "Topilmadi" }, { status: 404 });
  if (existing === undefined) return forbidden();

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

  const payment = await prisma.clientPayment.update({
    where: { id: paymentId },
    data: {
      amountCny: amount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      note: note?.trim() || null,
    },
  });

  revalidateAppData("orders");
  return Response.json({ payment });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  if (user.role !== "admin") return forbidden("Faqat admin to'lovni o'chira oladi");

  const { id, paymentId } = await params;
  const existing = await getPayment(id, paymentId, user);
  if (existing === null) return Response.json({ error: "Topilmadi" }, { status: 404 });
  if (existing === undefined) return forbidden();

  await prisma.clientPayment.delete({ where: { id: paymentId } });

  revalidateAppData("orders");
  return Response.json({ ok: true });
}

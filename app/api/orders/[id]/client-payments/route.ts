import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/order-finance";

function isValidMethod(method: string) {
  return PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number]);
}

async function getAllowedOrder(orderId: string, user: { id: string; role: string }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, createdBy: true },
  });
  if (!order) return null;
  if (user.role === "manager" && order.createdBy !== user.id) return undefined;
  return order;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  if (user.role === "manager" && !user.canCreateClientPayments) {
    return forbidden("Mijoz to'lovini kiritish huquqi yo'q");
  }

  const { id } = await params;
  const order = await getAllowedOrder(id, user);
  if (order === null) return Response.json({ error: "Topilmadi" }, { status: 404 });
  if (order === undefined) return forbidden();

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

  const payment = await prisma.clientPayment.create({
    data: {
      orderId: id,
      amountCny: amount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      note: note?.trim() || null,
      createdBy: user.id,
    },
  });

  revalidateAppData("orders");
  return Response.json({ payment }, { status: 201 });
}

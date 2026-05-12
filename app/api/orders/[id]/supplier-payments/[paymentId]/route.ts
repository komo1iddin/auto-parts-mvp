import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAuth, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/order-finance";

function isValidMethod(method: string) {
  return PAYMENT_METHODS.includes(method as (typeof PAYMENT_METHODS)[number]);
}

async function getPayment(orderId: string, paymentId: string) {
  const payment = await prisma.supplierPayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.orderId !== orderId) return null;
  return payment;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return unauthorized();
  }
  if (user.role !== "admin") return forbidden();

  const { id, paymentId } = await params;
  const existing = await getPayment(id, paymentId);
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });

  const { amountCny, paymentDate, paymentMethod, note, supplierId } = await req.json();
  const amount = Number(amountCny);
  if (!supplierId) return Response.json({ error: "Ta'minotchi majburiy" }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: "To'lov miqdori noto'g'ri" }, { status: 400 });
  }
  if (!paymentDate || Number.isNaN(new Date(paymentDate).getTime())) {
    return Response.json({ error: "To'lov sanasi noto'g'ri" }, { status: 400 });
  }
  if (!isValidMethod(paymentMethod)) {
    return Response.json({ error: "To'lov usuli noto'g'ri" }, { status: 400 });
  }

  const orderSupplier = await prisma.orderItem.findFirst({
    where: { orderId: id, supplierId },
    select: { id: true },
  });
  if (!orderSupplier) return forbidden("Bu ta'minotchi buyurtmada yo'q");

  const payment = await prisma.supplierPayment.update({
    where: { id: paymentId },
    data: {
      supplierId,
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
  try {
    const user = await requireAuth();
    if (user.role !== "admin") return forbidden();
  } catch {
    return unauthorized();
  }

  const { id, paymentId } = await params;
  const existing = await getPayment(id, paymentId);
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });

  await prisma.supplierPayment.delete({ where: { id: paymentId } });

  revalidateAppData("orders");
  return Response.json({ ok: true });
}

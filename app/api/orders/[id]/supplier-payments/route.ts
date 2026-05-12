import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { forbidden, requireAuth, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { PAYMENT_METHODS } from "@/lib/order-finance";

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

  const payment = await prisma.supplierPayment.create({
    data: {
      orderId: id,
      supplierId,
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

import { prisma } from "@/lib/prisma";
import { revalidateAppData } from "@/lib/data";
import { canAccessOrder } from "./order-access";
import type { OrderRouteUser } from "./order-types";

export async function renameOrderResponse(id: string, user: OrderRouteUser, currentOrderNumber: unknown) {
  const nextName = String(currentOrderNumber ?? "").trim();
  if (!nextName) {
    return Response.json({ error: "Buyurtma nomi bo'sh bo'lishi mumkin emas" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });
  if (!canAccessOrder(user, existing.createdBy)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  if (existing.currentOrderNumber === nextName) return Response.json({ order: existing });

  const duplicate = await prisma.order.findUnique({ where: { currentOrderNumber: nextName } });
  if (duplicate && duplicate.id !== id) {
    return Response.json({ error: "Bu nomdagi buyurtma allaqachon mavjud" }, { status: 409 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      baseOrderNumber: nextName,
      currentOrderNumber: nextName,
      updatedBy: user.id,
    },
  });

  await prisma.orderRevision.create({
    data: {
      orderId: id,
      version: existing.version,
      oldOrderNumber: existing.currentOrderNumber,
      newOrderNumber: nextName,
      changedBy: user.id,
      changeNote: `Buyurtma nomi "${existing.currentOrderNumber}" dan "${nextName}" ga o'zgartirildi`,
    },
  });

  revalidateAppData("orders");
  return Response.json({ order: updated });
}

export async function cancelOrderResponse(id: string, user: OrderRouteUser) {
  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });
  if (!canAccessOrder(user, existing.createdBy)) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

  await prisma.order.update({
    where: { id },
    data: { status: "cancelled", updatedBy: user.id },
  });

  await prisma.orderRevision.create({
    data: {
      orderId: id,
      version: existing.version,
      oldOrderNumber: existing.currentOrderNumber,
      newOrderNumber: existing.currentOrderNumber,
      changedBy: user.id,
      changeNote: "Buyurtma bekor qilindi",
    },
  });

  revalidateAppData("orders");
  return Response.json({ ok: true });
}

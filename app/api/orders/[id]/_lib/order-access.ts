import { prisma } from "@/lib/prisma";
import type { OrderRouteUser } from "./order-types";

export function canAccessOrder(user: OrderRouteUser, createdBy: string) {
  return user.role !== "manager" || createdBy === user.id;
}

export async function getOrderResponse(id: string, user: OrderRouteUser) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { partCode: "asc" } },
      creator: { select: { name: true } },
      updater: { select: { name: true } },
      customer: { select: { name: true } },
      revisions: {
        orderBy: { version: "desc" },
        include: { changer: { select: { name: true } } },
      },
    },
  });

  if (!order) return Response.json({ error: "Topilmadi" }, { status: 404 });
  if (!canAccessOrder(user, order.createdBy)) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  return Response.json({ order: sanitizeOrder(order, user.role === "admin") });
}

function sanitizeOrder<T extends { items: Array<Record<string, unknown>> }>(order: T, isAdmin: boolean) {
  return {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      purchasePriceCny: isAdmin ? item.purchasePriceCny : undefined,
      wholesalePriceCny: isAdmin ? item.wholesalePriceCny : undefined,
      supplierName: isAdmin ? item.supplierName : undefined,
      supplierId: isAdmin ? item.supplierId : undefined,
    })),
  };
}

import { prisma } from "@/lib/prisma";
import { revalidateAppData } from "@/lib/data";
import { isEditableOrderStatus } from "@/lib/utils";
import { attachCatalogToOrderItems } from "@/lib/order-catalog";
import { buildReplacementItems } from "./order-items";
import { canAccessOrder } from "./order-access";
import type { ExistingOrderItem, IncomingOrderItem, OrderRouteUser } from "./order-types";

type UpdateOrderBody = {
  customerId?: string;
  items?: IncomingOrderItem[];
  status?: string;
  changeNote?: string | null;
};

export async function updateOrderResponse(id: string, user: OrderRouteUser, body: UpdateOrderBody) {
  const validation = await validateOrderUpdate(body);
  if (validation) return validation;

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });
  if (!canAccessOrder(user, existing.createdBy)) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  if (existing.status === "cancelled") {
    return Response.json({ error: "Bekor qilingan buyurtmani tahrirlash mumkin emas" }, { status: 400 });
  }

  return replaceOrderItemsAndVersion(id, user, body, existing);
}

async function validateOrderUpdate(body: UpdateOrderBody) {
  const { customerId, items, status } = body;
  if (!customerId) return Response.json({ error: "Mijoz tanlash majburiy" }, { status: 400 });
  if (status != null && !isEditableOrderStatus(status)) {
    return Response.json({ error: "Buyurtma holati noto'g'ri" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Kamida bitta qism kerak" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  return customer ? null : Response.json({ error: "Mijoz topilmadi" }, { status: 400 });
}

async function replaceOrderItemsAndVersion(
  id: string,
  user: OrderRouteUser,
  body: UpdateOrderBody,
  existing: { version: number; baseOrderNumber: string; currentOrderNumber: string; items: ExistingOrderItem[] }
) {
  const newVersion = existing.version + 1;
  const newOrderNumber = `${existing.baseOrderNumber}-V${newVersion}`;
  const catalogItems = await attachCatalogToOrderItems(body.items ?? []);
  const replacementItems = buildReplacementItems(catalogItems, existing.items);
  const oldItemIds = existing.items.map((i) => i.id);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Delete old items first so the final order.update include returns only new items.
      await tx.orderItem.deleteMany({ where: { id: { in: oldItemIds } } });

      // Bulk-insert all new items in one round-trip.
      await tx.orderItem.createMany({
        data: replacementItems.map((item) => ({ ...item, orderId: id })),
      });

      const order = await tx.order.update({
        where: { id },
        data: {
          currentOrderNumber: newOrderNumber,
          version: newVersion,
          status: body.status ?? "updated",
          customerId: body.customerId,
          updatedBy: user.id,
        },
        include: { items: true, creator: { select: { name: true } }, customer: { select: { name: true } } },
      });

      await tx.orderRevision.create({
        data: {
          orderId: id,
          version: newVersion,
          oldOrderNumber: existing.currentOrderNumber,
          newOrderNumber,
          changedBy: user.id,
          changeNote: body.changeNote || null,
        },
      });

      return order;
    });

    revalidateAppData("orders");
    return Response.json({ order: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Xatolik yuz berdi";
    return Response.json({ error: message }, { status: 500 });
  }
}

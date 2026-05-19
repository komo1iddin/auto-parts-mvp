import type { NextRequest } from "next/server";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { clampShippedQuantity, getFulfillmentStatus } from "@/lib/order-fulfillment";
import { prisma } from "@/lib/prisma";
import { canAccessOrder } from "../_lib/order-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type FulfillmentEntry = {
  itemId?: string;
  receivedQuantity?: number;
};

type FulfillmentOrderItem = {
  id: string;
  quantity: number;
  shippedQuantity?: number | null;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const entries = Array.isArray(body.entries) ? body.entries as FulfillmentEntry[] : [];
  if (!entries.length) {
    return Response.json({ error: "Kamida bitta chiqim qatori kerak" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return Response.json({ error: "Buyurtma topilmadi" }, { status: 404 });
  if (!canAccessOrder(user, order.createdBy)) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }
  if (order.status === "cancelled") {
    return Response.json({ error: "Bekor qilingan buyurtmani o'zgartirib bo'lmaydi" }, { status: 400 });
  }

  const orderItems = order.items as FulfillmentOrderItem[];
  const itemsById = new Map(orderItems.map((item) => [item.id, item]));
  const updatedItems: unknown[] = [];

  for (const entry of entries) {
    if (!entry.itemId) continue;
    const item = itemsById.get(entry.itemId);
    if (!item) continue;

    const receivedQuantity = Math.max(0, Math.floor(Number(entry.receivedQuantity) || 0));
    if (receivedQuantity <= 0) continue;

    const shippedQuantity = clampShippedQuantity((item.shippedQuantity ?? 0) + receivedQuantity, item.quantity);
    const fulfillmentStatus = getFulfillmentStatus(item.quantity, shippedQuantity);

    if (shippedQuantity === (item.shippedQuantity ?? 0)) continue;
    const updated = await prisma.orderItem.update({
      where: { id: item.id },
      data: { shippedQuantity, fulfillmentStatus },
    });
    updatedItems.push(updated);
  }

  if (!updatedItems.length) {
    return Response.json({ error: "Saqlanadigan chiqim topilmadi" }, { status: 400 });
  }

  revalidateAppData("orders");
  return Response.json({ items: updatedItems });
}

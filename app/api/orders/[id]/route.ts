import type { NextRequest } from "next/server";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { getOrderResponse } from "./_lib/order-access";
import { cancelOrderResponse, renameOrderResponse } from "./_lib/order-lifecycle";
import { updateOrderResponse } from "./_lib/order-update";

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: OrderRouteContext) {
  const user = await getRouteUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  return getOrderResponse(id, user);
}

export async function PUT(req: NextRequest, context: OrderRouteContext) {
  const user = await getRouteUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  return updateOrderResponse(id, user, await req.json());
}

export async function PATCH(req: NextRequest, context: OrderRouteContext) {
  const user = await getRouteUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  const { currentOrderNumber } = await req.json();
  return renameOrderResponse(id, user, currentOrderNumber);
}

export async function DELETE(_req: NextRequest, context: OrderRouteContext) {
  const user = await getRouteUser();
  if (!user) return unauthorized();

  const { id } = await context.params;
  return cancelOrderResponse(id, user);
}

async function getRouteUser() {
  try {
    return await requireAdminOrManager();
  } catch {
    return null;
  }
}

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { isEditableOrderStatus } from "@/lib/utils";

type IncomingOrderItem = {
  id?: string;
  partId?: string;
  partVariantId?: string;
  partCode: string;
  partName?: string;
  categoryName?: string;
  brand?: string;
  type?: string;
  purchasePriceCny?: number | null;
  wholesalePriceCny?: number | null;
  sellingPriceCny?: number | null;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity: number;
  note?: string | null;
};

type ExistingOrderItem = IncomingOrderItem & {
  id: string;
};

function numberOrPrevious(value: unknown, previous: unknown) {
  if (value != null && value !== "") return Number(value);
  if (previous != null && previous !== "") return Number(previous);
  return null;
}

function stringOrPrevious(value: unknown, previous: unknown) {
  const next = typeof value === "string" ? value.trim() : value;
  if (next) return String(next);
  if (previous) return String(previous);
  return null;
}

function buildReplacementItems(items: IncomingOrderItem[], existingItems: ExistingOrderItem[]) {
  const usedExistingIds = new Set<string>();

  return items.map((item) => {
    const previousById = item.id
      ? existingItems.find((existingItem) => existingItem.id === item.id)
      : undefined;
    const previousByPartId = item.partId
      ? existingItems.find((existingItem) => (
          !usedExistingIds.has(existingItem.id) && existingItem.partId === item.partId
        ))
      : undefined;
    const previousByPartVariantId = item.partVariantId
      ? existingItems.find((existingItem) => (
          !usedExistingIds.has(existingItem.id) && existingItem.partVariantId === item.partVariantId
        ))
      : undefined;
    const previousByCode = existingItems.find((existingItem) => (
      !usedExistingIds.has(existingItem.id) && existingItem.partCode === item.partCode
    ));
    const previous = previousById ?? previousByPartVariantId ?? previousByPartId ?? previousByCode;
    if (previous) usedExistingIds.add(previous.id);

    return {
      partId: item.partId || previous?.partId || null,
      partVariantId: item.partVariantId || previous?.partVariantId || null,
      partCode: item.partCode,
      partName: item.partName || previous?.partName || null,
      categoryName: item.categoryName || previous?.categoryName || null,
      brand: item.brand || previous?.brand || null,
      type: item.type || previous?.type || null,
      purchasePriceCny: numberOrPrevious(item.purchasePriceCny, previous?.purchasePriceCny),
      wholesalePriceCny: numberOrPrevious(item.wholesalePriceCny, previous?.wholesalePriceCny),
      sellingPriceCny: numberOrPrevious(item.sellingPriceCny, previous?.sellingPriceCny),
      supplierId: stringOrPrevious(item.supplierId, previous?.supplierId),
      supplierName: stringOrPrevious(item.supplierName, previous?.supplierName),
      quantity: Number(item.quantity) || previous?.quantity || 1,
      note: item.note || previous?.note || null,
    };
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { id } = await params;

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

  // Manager can only see own orders
  if (user?.role === "manager" && order.createdBy !== user.id) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  // Strip purchase prices for manager
  const isAdmin = user?.role === "admin";
  const sanitized = {
    ...order,
    items: order.items.map((item) => ({
      ...item,
      purchasePriceCny: isAdmin ? item.purchasePriceCny : undefined,
      wholesalePriceCny: isAdmin ? item.wholesalePriceCny : undefined,
      supplierName: isAdmin ? item.supplierName : undefined,
      supplierId: isAdmin ? item.supplierId : undefined,
    })),
  };

  return Response.json({ order: sanitized });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const body = await req.json();
  const { customerId, items, status, changeNote } = body;
  if (!customerId) {
    return Response.json({ error: "Mijoz tanlash majburiy" }, { status: 400 });
  }
  if (status != null && !isEditableOrderStatus(status)) {
    return Response.json({ error: "Buyurtma holati noto'g'ri" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Kamida bitta qism kerak" }, { status: 400 });
  }
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return Response.json({ error: "Mijoz topilmadi" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });

  if (user.role === "manager" && existing.createdBy !== user.id) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  if (existing.status === "cancelled") {
    return Response.json({ error: "Bekor qilingan buyurtmani tahrirlash mumkin emas" }, { status: 400 });
  }

  const newVersion = existing.version + 1;
  const baseParts = existing.baseOrderNumber;
  const newOrderNumber = `${baseParts}-V${newVersion}`;
  const replacementItems = buildReplacementItems(items, existing.items);
  const createdItemIds: string[] = [];

  try {
    for (const item of replacementItems) {
      const created = await prisma.orderItem.create({ data: { ...item, orderId: id } });
      createdItemIds.push(created.id);
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        currentOrderNumber: newOrderNumber,
        version: newVersion,
        status: status ?? "updated",
        customerId,
        updatedBy: user.id,
      },
      include: { items: true, creator: { select: { name: true } }, customer: { select: { name: true } } },
    });

    for (const item of existing.items) {
      await prisma.orderItem.delete({ where: { id: item.id } });
    }

    await prisma.orderRevision.create({
      data: {
        orderId: id,
        version: newVersion,
        oldOrderNumber: existing.currentOrderNumber,
        newOrderNumber,
        changedBy: user.id,
        changeNote: changeNote || null,
      },
    });

    revalidateAppData("orders");
    return Response.json({ order: updated });
  } catch (error) {
    for (const createdId of createdItemIds) {
      await prisma.orderItem.delete({ where: { id: createdId } }).catch(() => {});
    }

    const message = error instanceof Error ? error.message : "Xatolik yuz berdi";
    return Response.json({ error: message }, { status: 500 });
  }

}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { id } = await params;
  const { currentOrderNumber } = await req.json();
  const nextName = String(currentOrderNumber ?? "").trim();

  if (!nextName) {
    return Response.json({ error: "Buyurtma nomi bo'sh bo'lishi mumkin emas" }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });

  if (user.role === "manager" && existing.createdBy !== user.id) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  if (existing.currentOrderNumber === nextName) {
    return Response.json({ order: existing });
  }

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { id } = await params;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Topilmadi" }, { status: 404 });

  if (user.role === "manager" && existing.createdBy !== user.id) {
    return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
  }

  // Soft cancel instead of delete
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

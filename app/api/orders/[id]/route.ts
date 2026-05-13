import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";
import { isEditableOrderStatus } from "@/lib/utils";

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
  const { items, status, changeNote } = body;
  if (status != null && !isEditableOrderStatus(status)) {
    return Response.json({ error: "Buyurtma holati noto'g'ri" }, { status: 400 });
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

  // Delete old items and create new ones
  await prisma.orderItem.deleteMany({ where: { orderId: id } });

  const updated = await prisma.order.update({
    where: { id },
    data: {
      currentOrderNumber: newOrderNumber,
      version: newVersion,
      status: status ?? "updated",
      updatedBy: user.id,
      items: {
        create: (items ?? []).map((item: {
          partId?: string;
          partCode: string;
          partName?: string;
          categoryName?: string;
          brand?: string;
          type?: string;
          purchasePriceCny?: number;
          wholesalePriceCny?: number;
          sellingPriceCny?: number;
          supplierId?: string;
          supplierName?: string;
          quantity: number;
          note?: string;
        }) => ({
          partId: item.partId || null,
          partCode: item.partCode,
          partName: item.partName || null,
          categoryName: item.categoryName || null,
          brand: item.brand || null,
          type: item.type || null,
          purchasePriceCny: item.purchasePriceCny != null ? Number(item.purchasePriceCny) : null,
          wholesalePriceCny: item.wholesalePriceCny != null ? Number(item.wholesalePriceCny) : null,
          sellingPriceCny: item.sellingPriceCny != null ? Number(item.sellingPriceCny) : null,
          supplierId: item.supplierId || null,
          supplierName: item.supplierName || null,
          quantity: Number(item.quantity) || 1,
          note: item.note || null,
        })),
      },
    },
    include: { items: true, creator: { select: { name: true } } },
  });

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

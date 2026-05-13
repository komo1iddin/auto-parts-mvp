import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { getOrdersList, revalidateAppData } from "@/lib/data";
import { generateOrderNumber, buildOrderNumber, isEditableOrderStatus } from "@/lib/utils";

export async function GET(req: NextRequest) {
  let user;
  try {
    user = await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const take = Math.min(Number(searchParams.get("take") ?? "50"), 200);
  const skip = Number(searchParams.get("skip") ?? "0");

  if (skip > 0) {
    const where = {
      ...(status ? { status } : {}),
      ...(user.role === "manager" ? { createdBy: user.id } : {}),
    };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          creator: { select: { name: true } },
          updater: { select: { name: true } },
          customer: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.order.count({ where }),
    ]);
    return Response.json({ orders, total });
  }

  const { orders, total } = await getOrdersList(user.role, user.id, status ?? "", take);

  return Response.json({ orders, total });
}

export async function POST(req: NextRequest) {
  let user;
  try {
    const authUser = await requireAdminOrManager();
    user = authUser;
  } catch {
    return unauthorized();
  }

  const { customerId, items, status = "draft" } = await req.json();
  if (!customerId) {
    return Response.json({ error: "Mijoz tanlash majburiy" }, { status: 400 });
  }
  if (!items?.length) {
    return Response.json({ error: "Kamida bitta qism kerak" }, { status: 400 });
  }
  if (!isEditableOrderStatus(status)) {
    return Response.json({ error: "Buyurtma holati noto'g'ri" }, { status: 400 });
  }
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    return Response.json({ error: "Mijoz topilmadi" }, { status: 400 });
  }

  const today = new Date();
  const base = generateOrderNumber(today);

  // Get today's order count for sequence number
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const todayCount = await prisma.order.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } },
  });
  const seq = todayCount + 1;
  const orderNumber = buildOrderNumber(base, seq, 1);

  const order = await prisma.order.create({
    data: {
      baseOrderNumber: `${base}-${String(seq).padStart(3, "0")}`,
      currentOrderNumber: orderNumber,
      version: 1,
      status,
      customerId,
      createdBy: user.id,
      updatedBy: user.id,
      items: {
        create: items.map((item: {
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
    include: { items: true, creator: { select: { name: true } }, customer: { select: { name: true } } },
  });

  // Log first revision
  await prisma.orderRevision.create({
    data: {
      orderId: order.id,
      version: 1,
      newOrderNumber: orderNumber,
      changedBy: user.id,
      changeNote: "Buyurtma yaratildi",
    },
  });

  revalidateAppData("orders");
  return Response.json({ order }, { status: 201 });
}

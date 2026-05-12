import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

export const DATA_TAGS = {
  dashboard: "dashboard",
  orders: "orders",
  parts: "parts",
  categories: "categories",
  suppliers: "suppliers",
  users: "users",
} as const;

export function revalidateAppData(...tags: Array<keyof typeof DATA_TAGS>) {
  for (const tag of tags) revalidateTag(DATA_TAGS[tag], "max");
  revalidateTag(DATA_TAGS.dashboard, "max");
}

export const getAdminDashboardData = unstable_cache(
  async () => {
    const [partsCount, ordersCount, suppliersCount, usersCount, recentOrders] =
      await Promise.all([
        prisma.part.count(),
        prisma.order.count({ where: { status: { not: "cancelled" } } }),
        prisma.supplier.count(),
        prisma.user.count(),
        prisma.order.findMany({
          where: { status: { not: "cancelled" } },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: {
            creator: { select: { name: true } },
            _count: { select: { items: true } },
          },
        }),
      ]);

    return { partsCount, ordersCount, suppliersCount, usersCount, recentOrders };
  },
  ["admin-dashboard"],
  {
    tags: [
      DATA_TAGS.dashboard,
      DATA_TAGS.orders,
      DATA_TAGS.parts,
      DATA_TAGS.suppliers,
      DATA_TAGS.users,
    ],
    revalidate: 15,
  }
);

export const getManagerDashboardData = unstable_cache(
  async (userId: string) => {
    const [myOrdersCount, draftCount, recentOrders] = await Promise.all([
      prisma.order.count({ where: { createdBy: userId, status: { not: "cancelled" } } }),
      prisma.order.count({ where: { createdBy: userId, status: "draft" } }),
      prisma.order.findMany({
        where: { createdBy: userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { _count: { select: { items: true } } },
      }),
    ]);

    return { myOrdersCount, draftCount, recentOrders };
  },
  ["manager-dashboard"],
  {
    tags: [DATA_TAGS.dashboard, DATA_TAGS.orders],
    revalidate: 15,
  }
);

export const getOrdersList = unstable_cache(
  async (role: string, userId: string, status: string, take = 100) => {
    const where = {
      ...(status ? { status } : {}),
      ...(role === "manager" ? { createdBy: userId } : {}),
    };

    const baseWhere = {
      ...(role === "manager" ? { createdBy: userId } : {}),
    };

    const [rawOrders, total, statusGroups] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          creator: { select: { name: true } },
          updater: { select: { name: true } },
          _count: { select: { items: true } },
          items: {
            select: {
              quantity: true,
              purchasePriceCny: true,
              sellingPriceCny: true,
              supplierName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take,
        skip: 0,
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { _all: true },
      }),
    ]);

    const orders = rawOrders.map((o) => ({
      ...o,
      totalQty: o.items.reduce((s, i) => s + i.quantity, 0),
      totalPurchase: o.items.reduce((s, i) => s + Number(i.purchasePriceCny ?? 0) * i.quantity, 0),
      totalSelling: o.items.reduce((s, i) => s + Number(i.sellingPriceCny ?? 0) * i.quantity, 0),
      supplierNames: [...new Set(o.items.map((i) => i.supplierName).filter(Boolean))],
      items: undefined,
    }));

    const statusCounts: Record<string, number> = {};
    let allTotal = 0;
    for (const g of statusGroups) {
      statusCounts[g.status] = g._count._all;
      allTotal += g._count._all;
    }
    statusCounts[""] = allTotal;

    return { orders, total, statusCounts };
  },
  ["orders-list"],
  {
    tags: [DATA_TAGS.orders],
    revalidate: 10,
  }
);

export const getPartsList = unstable_cache(
  async (
    role: string,
    q = "",
    categoryId = "",
    supplierId = "",
    brand = "",
    take = 100,
    skip = 0
  ) => {
    const where = {
      AND: [
        q
          ? {
              OR: [
                { code: { contains: q, mode: "insensitive" as const } },
                { name: { contains: q, mode: "insensitive" as const } },
                { brand: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {},
        categoryId ? { categoryId } : {},
        supplierId ? { supplierId } : {},
        brand ? { brand: { contains: brand, mode: "insensitive" as const } } : {},
      ],
    };

    const [parts, total] = await Promise.all([
      prisma.part.findMany({
        where,
        include: { category: true, supplier: true },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.part.count({ where }),
    ]);

    const isAdmin = role === "admin";
    const sanitized = parts.map((part) => ({
      ...part,
      purchasePriceCny: isAdmin ? part.purchasePriceCny : undefined,
      wholesalePriceCny: isAdmin ? part.wholesalePriceCny : undefined,
      supplier: isAdmin ? part.supplier : undefined,
      note: isAdmin ? part.note : undefined,
    }));

    return { parts: sanitized, total };
  },
  ["parts-list"],
  {
    tags: [DATA_TAGS.parts, DATA_TAGS.categories, DATA_TAGS.suppliers],
    revalidate: 10,
  }
);

export const getUsersList = unstable_cache(
  async () => {
    return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  },
  ["users-list"],
  {
    tags: [DATA_TAGS.users],
    revalidate: 15,
  }
);

export const getCategoriesList = unstable_cache(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      include: { children: { orderBy: { name: "asc" } } },
    });

    return categories.filter((category) => !category.parentId);
  },
  ["categories-list"],
  {
    tags: [DATA_TAGS.categories],
    revalidate: 15,
  }
);

export const getSuppliersList = unstable_cache(
  async () => {
    return prisma.supplier.findMany({ orderBy: { name: "asc" } });
  },
  ["suppliers-list"],
  {
    tags: [DATA_TAGS.suppliers],
    revalidate: 15,
  }
);

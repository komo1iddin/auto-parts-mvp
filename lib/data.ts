import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  calculateOrderFinance,
  type FinanceItem,
  type FinancePayment,
  type OrderFinanceStatus,
  type OrderFinanceSummary,
  type PaymentStatus,
} from "@/lib/order-finance";
import { ORDER_STATUS_KEYS } from "@/lib/utils";

export const DATA_TAGS = {
  dashboard: "dashboard",
  orders: "orders",
  parts: "parts",
  categories: "categories",
  suppliers: "suppliers",
  customers: "customers",
  users: "users",
  settings: "settings",
} as const;

export function revalidateAppData(...tags: Array<keyof typeof DATA_TAGS>) {
  for (const tag of tags) revalidateTag(DATA_TAGS[tag], { expire: 0 });
  revalidateTag(DATA_TAGS.dashboard, { expire: 0 });
}

type DashboardRawOrder = {
  items: FinanceItem[];
  clientPayments: FinancePayment[];
  supplierPayments: FinancePayment[];
};

export interface DashboardRecentOrderFinance {
  clientTotal: number;
  supplierTotal: number;
  expectedGrossProfit: number;
  clientPaid: number;
  supplierPaid: number;
  clientBalance: number;
  supplierBalance: number;
  clientPaymentStatus: PaymentStatus;
  orderFinanceStatus: OrderFinanceStatus;
}

export interface DashboardFinanceTotals {
  clientTotal: number;
  supplierTotal: number;
  expectedGrossProfit: number;
  clientPaid: number;
  supplierPaid: number;
  clientBalance: number;
  supplierBalance: number;
  openOrdersCount: number;
  clientBalanceOrdersCount: number;
  supplierBalanceOrdersCount: number;
  financeStatusCounts: Record<OrderFinanceStatus, number>;
  orderStatusCounts: Record<string, number>;
}

const FINANCE_STATUS_KEYS: OrderFinanceStatus[] = [
  "waiting_client_payment",
  "client_partially_paid",
  "ready_to_pay_supplier",
  "supplier_partially_paid",
  "supplier_paid",
  "closed",
];

function summarizeDashboardFinance(orders: DashboardRawOrder[]): DashboardFinanceTotals {
  const totals: DashboardFinanceTotals = {
    clientTotal: 0,
    supplierTotal: 0,
    expectedGrossProfit: 0,
    clientPaid: 0,
    supplierPaid: 0,
    clientBalance: 0,
    supplierBalance: 0,
    openOrdersCount: 0,
    clientBalanceOrdersCount: 0,
    supplierBalanceOrdersCount: 0,
    financeStatusCounts: Object.fromEntries(FINANCE_STATUS_KEYS.map((status) => [status, 0])) as Record<OrderFinanceStatus, number>,
    orderStatusCounts: Object.fromEntries(ORDER_STATUS_KEYS.map((status) => [status, 0])),
  };

  for (const order of orders) {
    const finance = calculateOrderFinance(order.items, order.clientPayments, order.supplierPayments);
    totals.clientTotal += finance.clientTotal;
    totals.supplierTotal += finance.supplierTotal;
    totals.expectedGrossProfit += finance.expectedGrossProfit;
    totals.clientPaid += finance.clientPaid;
    totals.supplierPaid += finance.supplierPaid;
    totals.clientBalance += finance.clientBalance;
    totals.supplierBalance += finance.supplierBalance;
    if (finance.orderFinanceStatus !== "closed") totals.openOrdersCount += 1;
    if (finance.clientBalance > 0) totals.clientBalanceOrdersCount += 1;
    if (finance.supplierBalance > 0) totals.supplierBalanceOrdersCount += 1;
    totals.financeStatusCounts[finance.orderFinanceStatus] += 1;
  }

  return totals;
}

function pickRecentOrderFinance(summary: OrderFinanceSummary): DashboardRecentOrderFinance {
  return {
    clientTotal: summary.clientTotal,
    supplierTotal: summary.supplierTotal,
    expectedGrossProfit: summary.expectedGrossProfit,
    clientPaid: summary.clientPaid,
    supplierPaid: summary.supplierPaid,
    clientBalance: summary.clientBalance,
    supplierBalance: summary.supplierBalance,
    clientPaymentStatus: summary.clientPaymentStatus,
    orderFinanceStatus: summary.orderFinanceStatus,
  };
}

function withDashboardFinance<T extends DashboardRawOrder>(order: T) {
  const finance = calculateOrderFinance(order.items, order.clientPayments, order.supplierPayments);
  return {
    ...order,
    finance: pickRecentOrderFinance(finance),
    totalQty: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: undefined,
    clientPayments: undefined,
    supplierPayments: undefined,
  };
}

export const getAdminDashboardData = unstable_cache(
  async () => {
    const [partsCount, ordersCount, suppliersCount, usersCount, activeOrders, statusCounts, recentOrders] =
      await Promise.all([
        prisma.part.count(),
        prisma.order.count({ where: { status: { not: "cancelled" } } }),
        prisma.supplier.count(),
        prisma.user.count(),
        prisma.order.findMany({
          where: { status: { not: "cancelled" } },
          include: {
            items: {
              select: {
                supplierId: true,
                supplierName: true,
                quantity: true,
                purchasePriceCny: true,
                sellingPriceCny: true,
              },
            },
            clientPayments: { select: { amountCny: true } },
            supplierPayments: { select: { supplierId: true, amountCny: true } },
          },
        }),
        prisma.order.groupBy({
          by: ["status"],
          where: { status: { not: "cancelled" } },
          _count: { status: true },
        }),
        prisma.order.findMany({
          where: { status: { not: "cancelled" } },
          orderBy: { updatedAt: "desc" },
          take: 5,
          include: {
            creator: { select: { name: true } },
            customer: { select: { name: true } },
            _count: { select: { items: true } },
            items: {
              select: {
                supplierId: true,
                supplierName: true,
                quantity: true,
                purchasePriceCny: true,
                sellingPriceCny: true,
              },
            },
            clientPayments: { select: { amountCny: true } },
            supplierPayments: { select: { supplierId: true, amountCny: true } },
          },
        }),
      ]);

    const financeTotals = summarizeDashboardFinance(activeOrders);
    for (const row of statusCounts) {
      financeTotals.orderStatusCounts[row.status] = row._count.status;
    }

    return {
      partsCount,
      ordersCount,
      suppliersCount,
      usersCount,
      financeTotals,
      recentOrders: recentOrders.map(withDashboardFinance),
    };
  },
  ["admin-dashboard"],
  {
    tags: [
      DATA_TAGS.dashboard,
      DATA_TAGS.orders,
      DATA_TAGS.customers,
      DATA_TAGS.parts,
      DATA_TAGS.suppliers,
      DATA_TAGS.users,
    ],
    revalidate: 15,
  }
);

export const getManagerDashboardData = unstable_cache(
  async (userId: string) => {
    const [myOrdersCount, draftCount, myOrders, statusCounts, recentOrders] = await Promise.all([
      prisma.order.count({ where: { createdBy: userId, status: { not: "cancelled" } } }),
      prisma.order.count({ where: { createdBy: userId, status: "draft" } }),
      prisma.order.findMany({
        where: { createdBy: userId, status: { not: "cancelled" } },
        include: {
          items: {
            select: {
              supplierId: true,
              supplierName: true,
              quantity: true,
              purchasePriceCny: true,
              sellingPriceCny: true,
            },
          },
          clientPayments: { select: { amountCny: true } },
          supplierPayments: { select: { supplierId: true, amountCny: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: { createdBy: userId, status: { not: "cancelled" } },
        _count: { status: true },
      }),
      prisma.order.findMany({
        where: { createdBy: userId, status: { not: "cancelled" } },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          _count: { select: { items: true } },
          customer: { select: { name: true } },
          items: {
            select: {
              supplierId: true,
              supplierName: true,
              quantity: true,
              purchasePriceCny: true,
              sellingPriceCny: true,
            },
          },
          clientPayments: { select: { amountCny: true } },
          supplierPayments: { select: { supplierId: true, amountCny: true } },
        },
      }),
    ]);

    const financeTotals = summarizeDashboardFinance(myOrders);
    for (const row of statusCounts) {
      financeTotals.orderStatusCounts[row.status] = row._count.status;
    }

    return {
      myOrdersCount,
      draftCount,
      financeTotals,
      recentOrders: recentOrders.map(withDashboardFinance),
    };
  },
  ["manager-dashboard"],
  {
    tags: [DATA_TAGS.dashboard, DATA_TAGS.orders, DATA_TAGS.customers],
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
    const STATUS_KEYS = ORDER_STATUS_KEYS;

    const [rawOrders, total, ...statusCountsArr] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          creator: { select: { name: true } },
          updater: { select: { name: true } },
          customer: { select: { name: true } },
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
      ...STATUS_KEYS.map((s) => prisma.order.count({ where: { ...baseWhere, status: s } })),
    ]);

    const isAdmin = role === "admin";
    const orders = rawOrders.map((o) => ({
      ...o,
      totalQty: o.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0),
      totalPurchase: isAdmin
        ? o.items.reduce((s: number, i: { purchasePriceCny: unknown; quantity: number }) => s + Number(i.purchasePriceCny ?? 0) * i.quantity, 0)
        : undefined,
      totalSelling: o.items.reduce((s: number, i: { sellingPriceCny: unknown; quantity: number }) => s + Number(i.sellingPriceCny ?? 0) * i.quantity, 0),
      supplierNames: [...new Set(o.items.map((i: { supplierName: string | null }) => i.supplierName).filter(Boolean))],
      items: undefined,
    }));

    const statusCounts: Record<string, number> = {};
    STATUS_KEYS.forEach((s, idx) => { statusCounts[s] = statusCountsArr[idx] as number; });
    statusCounts[""] = STATUS_KEYS.reduce((sum, s) => sum + (statusCounts[s] ?? 0), 0);

    return { orders, total, statusCounts };
  },
  ["orders-list"],
  {
    tags: [DATA_TAGS.orders, DATA_TAGS.customers],
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
                { part: { code: { contains: q, mode: "insensitive" as const } } },
                { part: { name: { contains: q, mode: "insensitive" as const } } },
                { brand: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {},
        categoryId ? { part: { categoryId } } : {},
        supplierId ? { supplierId } : {},
        brand ? { brand: { contains: brand, mode: "insensitive" as const } } : {},
      ],
    };

    const [variants, total] = await Promise.all([
      prisma.partVariant.findMany({
        where,
        include: { part: { include: { category: true } }, supplier: true },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.partVariant.count({ where }),
    ]);

    const isAdmin = role === "admin";
    const sanitized = variants.map((variant) => ({
      ...variant,
      partId: variant.partId,
      code: variant.part.code,
      name: variant.part.name,
      categoryId: variant.part.categoryId,
      category: variant.part.category,
      purchasePriceCny: isAdmin ? variant.purchasePriceCny : undefined,
      wholesalePriceCny: isAdmin ? variant.wholesalePriceCny : undefined,
      supplier: isAdmin ? variant.supplier : undefined,
      note: isAdmin ? variant.note : undefined,
    }));

    return { parts: sanitized, total };
  },
  ["parts-list"],
  {
    tags: [DATA_TAGS.parts, DATA_TAGS.categories, DATA_TAGS.suppliers],
    revalidate: 10,
  }
);

export const SETTING_OPTION_KINDS = {
  brand: "brand",
  partQualityType: "part_quality_type",
} as const;

export type SettingOptionKind = (typeof SETTING_OPTION_KINDS)[keyof typeof SETTING_OPTION_KINDS];

export interface SettingOption {
  id: string;
  kind: SettingOptionKind;
  value: string;
  label: string;
  sortOrder: number;
}

export function makeSettingValue(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const getSettingOptions = unstable_cache(
  async (kind: SettingOptionKind) => {
    return prisma.settingOption.findMany({
      where: { kind },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }) as Promise<SettingOption[]>;
  },
  ["setting-options"],
  {
    tags: [DATA_TAGS.settings],
    revalidate: 15,
  }
);

export async function getPartFormOptions() {
  const [brands, partQualityTypes] = await Promise.all([
    getSettingOptions(SETTING_OPTION_KINDS.brand),
    getSettingOptions(SETTING_OPTION_KINDS.partQualityType),
  ]);

  return { brands, partQualityTypes };
}

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

export const getCustomersList = unstable_cache(
  async () => {
    return prisma.customer.findMany({ orderBy: { name: "asc" } });
  },
  ["customers-list"],
  {
    tags: [DATA_TAGS.customers],
    revalidate: 15,
  }
);

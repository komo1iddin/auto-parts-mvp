/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@supabase/supabase-js";

type AnyRecord = Record<string, any>;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase server environment variables");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const tableByModel = {
  user: "users",
  category: "categories",
  supplier: "suppliers",
  customer: "customers",
  part: "parts",
  order: "orders",
  orderItem: "order_items",
  orderRevision: "order_revisions",
  orderExport: "order_exports",
  clientPayment: "client_payments",
  supplierPayment: "supplier_payments",
  settingOption: "setting_options",
  partVariant: "part_variants",
  partSupplierPrice: "part_supplier_prices",
  partCodeAlias: "part_code_aliases",
} as const;

const columnByField: Record<string, string> = {
  parentId: "parent_id",
  categoryId: "category_id",
  supplierId: "supplier_id",
  imageUrl: "image_url",
  createdAt: "created_at",
  updatedAt: "updated_at",
  purchasePriceCny: "purchase_price_cny",
  wholesalePriceCny: "wholesale_price_cny",
  sellingPriceCny: "selling_price_cny",
  baseOrderNumber: "base_order_number",
  currentOrderNumber: "current_order_number",
  customerId: "customer_id",
  createdBy: "created_by",
  updatedBy: "updated_by",
  orderId: "order_id",
  partId: "part_id",
  partVariantId: "part_variant_id",
  partSupplierPriceId: "part_supplier_price_id",
  partCode: "part_code",
  partName: "part_name",
  categoryName: "category_name",
  supplierName: "supplier_name",
  oldOrderNumber: "old_order_number",
  newOrderNumber: "new_order_number",
  changedBy: "changed_by",
  changeNote: "change_note",
  exportType: "export_type",
  fileName: "file_name",
  exportedBy: "exported_by",
  amountCny: "amount_cny",
  paymentDate: "payment_date",
  paymentMethod: "payment_method",
  sortOrder: "sort_order",
  normalizedCode: "normalized_code",
};

const fieldByColumn = Object.fromEntries(
  Object.entries(columnByField).map(([field, column]) => [column, field])
);

const dateFields = new Set(["createdAt", "updatedAt", "paymentDate"]);

function toDbField(field: string) {
  return columnByField[field] ?? field;
}

function fromDbValue(field: string, value: unknown) {
  if (value == null) return value;
  if (dateFields.has(field) && typeof value === "string") return new Date(value);
  return value;
}

function fromDbRow<T = AnyRecord>(row: AnyRecord | null): T | null {
  if (!row) return null;
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      const field = fieldByColumn[key] ?? key;
      return [field, fromDbValue(field, value)];
    })
  ) as T;
}

function toDbData(data: AnyRecord): AnyRecord {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [toDbField(key), value])
  );
}

function compareBy(orderBy: any) {
  const orderRules = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
  return (a: AnyRecord, b: AnyRecord) => {
    for (const rule of orderRules) {
      const [field, direction] = Object.entries(rule)[0] as [string, any];
      const av = a[field] ?? "";
      const bv = b[field] ?? "";
      const result = av > bv ? 1 : av < bv ? -1 : 0;
      if (result !== 0) return direction === "desc" ? -result : result;
    }
    return 0;
  };
}

function unique<T>(values: T[]) {
  return [...new Set(values.filter(Boolean))] as T[];
}

function escapeFilterValue(value: unknown) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function toPostgrestCondition(field: string, value: any) {
  const column = toDbField(field);
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if ("contains" in value) return `${column}.ilike.%${escapeFilterValue(value.contains)}%`;
    if ("not" in value) return `${column}.not.eq.${value.not}`;
    if ("gte" in value) return `${column}.gte.${value.gte instanceof Date ? value.gte.toISOString() : value.gte}`;
    if ("lt" in value) return `${column}.lt.${value.lt instanceof Date ? value.lt.toISOString() : value.lt}`;
    return null;
  }
  return `${column}.eq.${value}`;
}

function applyWhere(query: any, where?: AnyRecord): any {
  if (!where) return query;

  for (const [field, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (field === "AND") {
      query = (value as AnyRecord[]).reduce((next, item) => applyWhere(next, item), query);
      continue;
    }
    if (field === "OR") {
      const conditions = (value as AnyRecord[])
        .map((item) => {
          const entries = Object.entries(item);
          return entries.length === 1 ? toPostgrestCondition(entries[0][0], entries[0][1]) : null;
        })
        .filter(Boolean);
      if (conditions.length) query = query.or(conditions.join(","));
      continue;
    }

    const column = toDbField(field);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if ("contains" in value) query = query.ilike(column, `%${escapeFilterValue(value.contains)}%`);
      if ("not" in value) query = query.neq(column, value.not);
      if ("gte" in value) query = query.gte(column, value.gte instanceof Date ? value.gte.toISOString() : value.gte);
      if ("lt" in value) query = query.lt(column, value.lt instanceof Date ? value.lt.toISOString() : value.lt);
      continue;
    }

    query = query.eq(column, value);
  }

  return query;
}

function applyOrder(query: any, orderBy?: any): any {
  const orderRules = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : [];
  for (const rule of orderRules) {
    const [field, direction] = Object.entries(rule)[0] as [string, any];
    query = query.order(toDbField(field), { ascending: direction !== "desc" });
  }
  return query;
}

function applyExactWhere(query: any, where?: AnyRecord): any {
  if (!where) return query;
  for (const [field, value] of Object.entries(where)) {
    if (value !== undefined) query = query.eq(toDbField(field), value);
  }
  return query;
}

function matchesCondition(value: unknown, condition: any): boolean {
  if (condition && typeof condition === "object" && !Array.isArray(condition)) {
    if ("contains" in condition) {
      const source = String(value ?? "");
      const needle = String(condition.contains ?? "");
      return condition.mode === "insensitive"
        ? source.toLowerCase().includes(needle.toLowerCase())
        : source.includes(needle);
    }
    if ("not" in condition) return value !== condition.not;
    if ("gte" in condition) return new Date(value as string).getTime() >= new Date(condition.gte).getTime();
    if ("lt" in condition) return new Date(value as string).getTime() < new Date(condition.lt).getTime();
  }

  return value === condition;
}

function matchesWhere(row: AnyRecord | null | undefined, where?: AnyRecord): boolean {
  if (!where || !row) return true;

  for (const [field, value] of Object.entries(where)) {
    if (value === undefined) continue;
    if (field === "AND") {
      if (!(value as AnyRecord[]).every((item) => matchesWhere(row, item))) return false;
      continue;
    }
    if (field === "OR") {
      if (!(value as AnyRecord[]).some((item) => matchesWhere(row, item))) return false;
      continue;
    }
    if (field === "part") {
      if (!matchesWhere(row.part, value as AnyRecord)) return false;
      continue;
    }

    if (!matchesCondition(row[field], value)) return false;
  }

  return true;
}

function hasRelationFilter(where?: AnyRecord): boolean {
  if (!where) return false;
  return Object.entries(where).some(([field, value]) => {
    if (field === "part") return true;
    if ((field === "AND" || field === "OR") && Array.isArray(value)) {
      return value.some((item) => hasRelationFilter(item));
    }
    return false;
  });
}

async function selectPartVariantRows(args: AnyRecord = {}): Promise<AnyRecord[]> {
  const rows = await selectAll("partVariant");
  const parts = await selectByIds("part", rows.map((row) => row.partId));
  const withParts = rows.map((row) => ({ ...row, part: row.partId ? parts.get(row.partId) ?? null : null }));
  const filtered = withParts.filter((row) => matchesWhere(row, args.where));
  const sorted = filtered.sort(compareBy(args.orderBy));

  if (typeof args.skip === "number" || typeof args.take === "number") {
    const from = args.skip ?? 0;
    const to = typeof args.take === "number" ? from + args.take : undefined;
    return sorted.slice(from, to);
  }

  return sorted;
}

async function selectRows(model: keyof typeof tableByModel, args: AnyRecord = {}): Promise<AnyRecord[]> {
  if (model === "partVariant" && hasRelationFilter(args.where)) {
    return selectPartVariantRows(args);
  }

  let query = supabase.from(tableByModel[model]).select("*");
  query = applyWhere(query, args.where);
  query = applyOrder(query, args.orderBy);
  if (typeof args.skip === "number" || typeof args.take === "number") {
    const from = args.skip ?? 0;
    const to = typeof args.take === "number" ? from + args.take - 1 : from + 999;
    query = query.range(from, to);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: AnyRecord) => fromDbRow(row)!);
}

async function selectAll(model: keyof typeof tableByModel): Promise<AnyRecord[]> {
  const { data, error } = await supabase.from(tableByModel[model]).select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => fromDbRow(row)!);
}

async function selectByIds(model: keyof typeof tableByModel, ids: string[]) {
  const idList = unique(ids);
  if (!idList.length) return new Map<string, AnyRecord>();
  const { data, error } = await supabase.from(tableByModel[model]).select("*").in("id", idList);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row: AnyRecord) => {
    const item = fromDbRow(row)!;
    return [item.id, item];
  }));
}

async function selectWhereIn(model: keyof typeof tableByModel, field: string, values: string[]) {
  const valueList = unique(values);
  if (!valueList.length) return [];
  const { data, error } = await supabase
    .from(tableByModel[model])
    .select("*")
    .in(toDbField(field), valueList);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: AnyRecord) => fromDbRow(row)!);
}

async function applyBatchedIncludes(model: keyof typeof tableByModel, rows: AnyRecord[], include?: AnyRecord) {
  if (!include || rows.length === 0) return rows;

  if (model === "category" && include.children) {
    const allCategories = await selectAll("category");
    const childrenByParent = new Map<string, AnyRecord[]>();
    for (const category of allCategories) {
      if (!category.parentId) continue;
      childrenByParent.set(category.parentId, [...(childrenByParent.get(category.parentId) ?? []), category]);
    }
    return rows.map((row) => ({
      ...row,
      children: (childrenByParent.get(row.id) ?? []).sort(compareBy(include.children.orderBy)),
    }));
  }

  if (model === "part") {
    const [categories, suppliers, aliases] = await Promise.all([
      include.category ? selectByIds("category", rows.map((row) => row.categoryId)) : Promise.resolve(new Map()),
      include.supplier ? selectByIds("supplier", rows.map((row) => row.supplierId)) : Promise.resolve(new Map()),
      include.codeAliases ? selectWhereIn("partCodeAlias", "partId", rows.map((row) => row.id)) : Promise.resolve([]),
    ]);
    const aliasesByPart = new Map<string, AnyRecord[]>();
    for (const alias of aliases as AnyRecord[]) {
      aliasesByPart.set(alias.partId, [...(aliasesByPart.get(alias.partId) ?? []), alias]);
    }

    return rows.map((row) => ({
      ...row,
      ...(include.category ? { category: row.categoryId ? categories.get(row.categoryId) ?? null : null } : {}),
      ...(include.supplier ? { supplier: row.supplierId ? suppliers.get(row.supplierId) ?? null : null } : {}),
      ...(include.codeAliases ? { codeAliases: aliasesByPart.get(row.id) ?? [] } : {}),
    }));
  }

  if (model === "partVariant") {
    const [parts, supplierPrices] = await Promise.all([
      include.part ? selectByIds("part", rows.map((row) => row.partId)) : Promise.resolve(new Map()),
      include.supplierPrices
        ? selectWhereIn("partSupplierPrice", "partVariantId", rows.map((row) => row.id))
        : Promise.resolve([]),
    ]);
    let partRows = Array.from(parts.values());
    if (include.part?.include) {
      partRows = await applyBatchedIncludes("part", partRows, include.part.include);
    }
    const partsWithIncludes = new Map(partRows.map((part) => [part.id, part]));

    const supplierPricesWithIncludes = (include.supplierPrices
      ? await applyBatchedIncludes("partSupplierPrice", supplierPrices, include.supplierPrices.include)
      : []) as AnyRecord[];
    const supplierPricesByVariant = new Map<string, AnyRecord[]>();
    for (const price of supplierPricesWithIncludes) {
      if (!price) continue;
      supplierPricesByVariant.set(price.partVariantId, [...(supplierPricesByVariant.get(price.partVariantId) ?? []), price]);
    }

    return rows.map((row) => ({
      ...row,
      ...(include.part ? { part: row.partId ? partsWithIncludes.get(row.partId) ?? null : null } : {}),
      ...(include.supplierPrices ? { supplierPrices: (supplierPricesByVariant.get(row.id) ?? []).sort(compareBy(include.supplierPrices.orderBy)) } : {}),
    }));
  }

  if (model === "partSupplierPrice") {
    const suppliers = include.supplier
      ? await selectByIds("supplier", rows.map((row) => row.supplierId))
      : new Map<string, AnyRecord>();

    return rows.map((row) => ({
      ...row,
      ...(include.supplier ? { supplier: row.supplierId ? suppliers.get(row.supplierId) ?? null : null } : {}),
    }));
  }

  if (model === "order") {
    const userIds = unique(rows.flatMap((row) => [row.createdBy, row.updatedBy]));
    const [users, customers, items, clientPayments, supplierPayments] = await Promise.all([
      include.creator || include.updater ? selectByIds("user", userIds) : Promise.resolve(new Map()),
      include.customer ? selectByIds("customer", rows.map((row) => row.customerId)) : Promise.resolve(new Map()),
      include._count?.select?.items || include.items
        ? selectWhereIn("orderItem", "orderId", rows.map((row) => row.id))
        : Promise.resolve([]),
      include.clientPayments
        ? selectWhereIn("clientPayment", "orderId", rows.map((row) => row.id))
        : Promise.resolve([]),
      include.supplierPayments
        ? selectWhereIn("supplierPayment", "orderId", rows.map((row) => row.id))
        : Promise.resolve([]),
    ]);
    const rowIds = new Set(rows.map((row) => row.id));
    const itemsByOrder = new Map<string, AnyRecord[]>();
    for (const item of items) {
      if (!rowIds.has(item.orderId)) continue;
      itemsByOrder.set(item.orderId, [...(itemsByOrder.get(item.orderId) ?? []), item]);
    }
    const clientPaymentsByOrder = new Map<string, AnyRecord[]>();
    for (const payment of clientPayments) {
      if (!rowIds.has(payment.orderId)) continue;
      clientPaymentsByOrder.set(payment.orderId, [...(clientPaymentsByOrder.get(payment.orderId) ?? []), payment]);
    }
    const supplierPaymentsByOrder = new Map<string, AnyRecord[]>();
    for (const payment of supplierPayments) {
      if (!rowIds.has(payment.orderId)) continue;
      supplierPaymentsByOrder.set(payment.orderId, [...(supplierPaymentsByOrder.get(payment.orderId) ?? []), payment]);
    }

    return rows.map((row) => {
      const orderItems = itemsByOrder.get(row.id) ?? [];
      return {
        ...row,
        ...(include.creator
          ? { creator: row.createdBy ? pick(users.get(row.createdBy), include.creator.select) : null }
          : {}),
        ...(include.updater
          ? { updater: row.updatedBy ? pick(users.get(row.updatedBy), include.updater.select) : null }
          : {}),
        ...(include.customer
          ? {
              customer: row.customerId
                ? include.customer.select
                  ? pick(customers.get(row.customerId), include.customer.select)
                  : customers.get(row.customerId) ?? null
                : null,
            }
          : {}),
        ...(include.items ? { items: orderItems.sort(compareBy(include.items.orderBy)) } : {}),
        ...(include.clientPayments
          ? { clientPayments: (clientPaymentsByOrder.get(row.id) ?? []).sort(compareBy(include.clientPayments.orderBy)) }
          : {}),
        ...(include.supplierPayments
          ? { supplierPayments: (supplierPaymentsByOrder.get(row.id) ?? []).sort(compareBy(include.supplierPayments.orderBy)) }
          : {}),
        ...(include._count?.select?.items ? { _count: { items: orderItems.length } } : {}),
      };
    });
  }

  if (model === "clientPayment") {
    const users = include.creator
      ? await selectByIds("user", rows.map((row) => row.createdBy))
      : new Map<string, AnyRecord>();

    return rows.map((row) => ({
      ...row,
      ...(include.creator
        ? {
            creator: row.createdBy
              ? include.creator.select
                ? pick(users.get(row.createdBy), include.creator.select)
                : users.get(row.createdBy) ?? null
              : null,
          }
        : {}),
    }));
  }

  if (model === "supplierPayment") {
    const [users, suppliers] = await Promise.all([
      include.creator ? selectByIds("user", rows.map((row) => row.createdBy)) : Promise.resolve(new Map()),
      include.supplier ? selectByIds("supplier", rows.map((row) => row.supplierId)) : Promise.resolve(new Map()),
    ]);

    return rows.map((row) => ({
      ...row,
      ...(include.creator
        ? {
            creator: row.createdBy
              ? include.creator.select
                ? pick(users.get(row.createdBy), include.creator.select)
                : users.get(row.createdBy) ?? null
              : null,
          }
        : {}),
      ...(include.supplier
        ? {
            supplier: row.supplierId
              ? include.supplier.select
                ? pick(suppliers.get(row.supplierId), include.supplier.select)
                : suppliers.get(row.supplierId) ?? null
              : null,
          }
        : {}),
    }));
  }

  return Promise.all(rows.map((row) => applyIncludes(model, row, include)));
}

async function applyIncludes(model: keyof typeof tableByModel, row: AnyRecord | null, include?: AnyRecord) {
  if (!include || !row) return row;

  if (model === "category" && include.children) {
    const children = (await selectAll("category"))
      .filter((category) => category.parentId === row.id)
      .sort(compareBy(include.children.orderBy));
    return { ...row, children };
  }

  if (model === "part") {
    const next = { ...row };
    if (include.category) next.category = row.categoryId ? await prisma.category.findUnique({ where: { id: row.categoryId } }) : null;
    if (include.supplier) next.supplier = row.supplierId ? await prisma.supplier.findUnique({ where: { id: row.supplierId } }) : null;
    if (include.codeAliases) {
      next.codeAliases = (await selectAll("partCodeAlias")).filter((alias) => alias.partId === row.id);
    }
    return next;
  }

  if (model === "partVariant") {
    const next = { ...row };
    if (include.part) {
      next.part = row.partId
        ? await prisma.part.findUnique({ where: { id: row.partId }, include: include.part.include })
        : null;
    }
    if (include.supplierPrices) {
      const prices = (await selectAll("partSupplierPrice"))
        .filter((price) => price.partVariantId === row.id)
        .sort(compareBy(include.supplierPrices.orderBy));
      next.supplierPrices = await Promise.all(prices.map((price) => applyIncludes("partSupplierPrice", price, include.supplierPrices.include)));
    }
    return next;
  }

  if (model === "partSupplierPrice") {
    const next = { ...row };
    if (include.supplier) {
      next.supplier = row.supplierId ? await prisma.supplier.findUnique({ where: { id: row.supplierId } }) : null;
    }
    return next;
  }

  if (model === "order") {
    const next = { ...row };
    const users = async (id: string | null) => (id ? prisma.user.findUnique({ where: { id } }) : null);
    if (include.customer) {
      const customer = row.customerId ? await prisma.customer.findUnique({ where: { id: row.customerId } }) : null;
      next.customer = customer && include.customer.select ? pick(customer, include.customer.select) : customer;
    }
    if (include.items) {
      next.items = (await selectAll("orderItem"))
        .filter((item) => item.orderId === row.id)
        .sort(compareBy(include.items.orderBy));
    }
    if (include.clientPayments) {
      next.clientPayments = (await selectAll("clientPayment"))
        .filter((payment) => payment.orderId === row.id)
        .sort(compareBy(include.clientPayments.orderBy));
    }
    if (include.supplierPayments) {
      next.supplierPayments = (await selectAll("supplierPayment"))
        .filter((payment) => payment.orderId === row.id)
        .sort(compareBy(include.supplierPayments.orderBy));
    }
    if (include.creator) {
      const creator = await users(row.createdBy);
      next.creator = creator && include.creator.select ? pick(creator, include.creator.select) : creator;
    }
    if (include.updater) {
      const updater = await users(row.updatedBy);
      next.updater = updater && include.updater.select ? pick(updater, include.updater.select) : updater;
    }
    if (include.revisions) {
      const revisions = (await selectAll("orderRevision"))
        .filter((revision) => revision.orderId === row.id)
        .sort(compareBy(include.revisions.orderBy));
      next.revisions = await Promise.all(
        revisions.map(async (revision) => {
          if (!include.revisions.include?.changer) return revision;
          const changer = await users(revision.changedBy);
          return {
            ...revision,
            changer: changer && include.revisions.include.changer.select
              ? pick(changer, include.revisions.include.changer.select)
              : changer,
          };
        })
      );
    }
    if (include._count?.select?.items) {
      next._count = {
        items: (await selectAll("orderItem")).filter((item) => item.orderId === row.id).length,
      };
    }
    return next;
  }

  if (model === "clientPayment") {
    const next = { ...row };
    if (include.creator) {
      const creator = row.createdBy ? await prisma.user.findUnique({ where: { id: row.createdBy } }) : null;
      next.creator = creator && include.creator.select ? pick(creator, include.creator.select) : creator;
    }
    return next;
  }

  if (model === "supplierPayment") {
    const next = { ...row };
    if (include.creator) {
      const creator = row.createdBy ? await prisma.user.findUnique({ where: { id: row.createdBy } }) : null;
      next.creator = creator && include.creator.select ? pick(creator, include.creator.select) : creator;
    }
    if (include.supplier) {
      const supplier = row.supplierId ? await prisma.supplier.findUnique({ where: { id: row.supplierId } }) : null;
      next.supplier = supplier && include.supplier.select ? pick(supplier, include.supplier.select) : supplier;
    }
    return next;
  }

  return row;
}

function pick(row: AnyRecord | null | undefined, select: AnyRecord) {
  if (!row) return null;
  return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, row[key]]));
}

function modelApi(model: keyof typeof tableByModel) {
  return {
    async findMany(args: AnyRecord = {}) {
      const rows = await selectRows(model, args);
      return applyBatchedIncludes(model, rows, args.include);
    },

    async count(args: AnyRecord = {}) {
      if (model === "partVariant" && hasRelationFilter(args.where)) {
        return (await selectPartVariantRows({ where: args.where })).length;
      }

      let query = supabase.from(tableByModel[model]).select("*", { count: "exact", head: true });
      query = applyWhere(query, args.where);
      const { count, error } = await query;
      if (error) throw new Error(error.message);
      return count ?? 0;
    },

    async groupBy(args: AnyRecord) {
      const by = Array.isArray(args.by) ? args.by : [args.by];
      const rows = await selectRows(model, { where: args.where });
      const groups = new Map<string, AnyRecord>();

      for (const row of rows) {
        const groupFields = Object.fromEntries(by.map((field: string) => [field, row[field]]));
        const key = JSON.stringify(groupFields);
        const group = groups.get(key) ?? { ...groupFields, _count: {} };
        const countFields = args._count === true ? by : Object.keys(args._count ?? {});

        for (const field of countFields) {
          group._count[field] = (group._count[field] ?? 0) + 1;
        }

        groups.set(key, group);
      }

      return [...groups.values()];
    },

    async findUnique(args: AnyRecord) {
      const [field, value] = Object.entries(args.where)[0];
      const { data, error } = await supabase
        .from(tableByModel[model])
        .select("*")
        .eq(toDbField(field), value)
        .maybeSingle();
      if (error) throw new Error(error.message);
      const row = fromDbRow(data);
      return applyIncludes(model, row, args.include);
    },

    async create(args: AnyRecord) {
      if (model === "order" && args.data?.items?.create) {
        const { items, ...orderData } = args.data;
        const { data, error } = await supabase
          .from(tableByModel.order)
          .insert(toDbData(orderData))
          .select("*")
          .single();
        if (error) throw new Error(`${model}.create: ${error.message}`);
        const order = fromDbRow(data)!;
        const itemRows = items.create.map((item: AnyRecord) => toDbData({ ...item, orderId: order.id }));
        const { error: itemsError } = await supabase.from(tableByModel.orderItem).insert(itemRows);
        if (itemsError) throw new Error("orderItem.createMany: " + itemsError.message);
        return applyIncludes(model, order, args.include);
      }

      const { data, error } = await supabase
        .from(tableByModel[model])
        .insert(toDbData(args.data))
        .select("*")
        .single();
      if (error) throw new Error(`${model}.create: ${error.message}`);
      return applyIncludes(model, fromDbRow(data)!, args.include);
    },

    async update(args: AnyRecord) {
      if (model === "order" && args.data?.items?.create) {
        const { items, ...orderData } = args.data;
        const { data, error } = await supabase
          .from(tableByModel.order)
          .update(toDbData(orderData))
          .eq("id", args.where.id)
          .select("*")
          .single();
        if (error) throw new Error(`${model}.update: ${error.message}`);
        const itemRows = items.create.map((item: AnyRecord) => toDbData({ ...item, orderId: args.where.id }));
        if (itemRows.length) {
          const { error: itemsError } = await supabase.from(tableByModel.orderItem).insert(itemRows);
          if (itemsError) throw new Error("orderItem.createMany: " + itemsError.message);
        }
        return applyIncludes(model, fromDbRow(data)!, args.include);
      }

      let query = supabase
        .from(tableByModel[model])
        .update(toDbData(args.data))
        .select("*");
      query = applyExactWhere(query, args.where);
      const { data, error } = await query.single();
      if (error) throw new Error(`${model}.update: ${error.message}`);
      return applyIncludes(model, fromDbRow(data)!, args.include);
    },

    async delete(args: AnyRecord) {
      let query = supabase.from(tableByModel[model]).delete();
      query = applyExactWhere(query, args.where);
      const { error } = await query;
      if (error) throw new Error(error.message);
      return {};
    },

    async deleteMany(args: AnyRecord) {
      const [field, value] = Object.entries(toDbData(args.where))[0];
      const { error } = await supabase.from(tableByModel[model]).delete().eq(field, value);
      if (error) throw new Error(error.message);
      return {};
    },

    async upsert(args: AnyRecord) {
      const existing = await this.findUnique({ where: args.where });
      return existing
        ? this.update({ where: { id: existing.id }, data: args.update })
        : this.create({ data: args.create });
    },
  };
}

export const prisma: any = {
  async $transaction(callback: (tx: typeof prisma) => Promise<unknown>) {
    return callback(prisma);
  },
  user: modelApi("user"),
  category: modelApi("category"),
  supplier: modelApi("supplier"),
  customer: modelApi("customer"),
  part: modelApi("part"),
  partVariant: modelApi("partVariant"),
  partSupplierPrice: modelApi("partSupplierPrice"),
  partCodeAlias: modelApi("partCodeAlias"),
  order: modelApi("order"),
  orderItem: modelApi("orderItem"),
  orderRevision: modelApi("orderRevision"),
  orderExport: modelApi("orderExport"),
  clientPayment: modelApi("clientPayment"),
  supplierPayment: modelApi("supplierPayment"),
  settingOption: modelApi("settingOption"),
};

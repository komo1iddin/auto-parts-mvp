import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdminOrManager, unauthorized } from "@/lib/auth";
import { revalidateAppData } from "@/lib/data";

type ParsedOrderRow = {
  rowKey: string;
  partCode: string;
  partName: string;
  categoryName: string;
  brand: string;
  type: string;
  purchasePriceCny: number | null;
  wholesalePriceCny: number | null;
  sellingPriceCny: number | null;
  supplierName: string;
  quantity: number;
  note: string;
};

type PartWithRelations = {
  id: string;
  partId: string;
  code: string;
  name?: string | null;
  categoryName?: string | null;
  brand?: string | null;
  type: string;
  purchasePriceCny?: unknown;
  wholesalePriceCny?: unknown;
  sellingPriceCny?: unknown;
  supplierId?: string | null;
  category?: { name?: string | null } | null;
  supplier?: { name?: string | null } | null;
};

type PartFamily = {
  id: string;
  code: string;
  name?: string | null;
  categoryId?: string | null;
  category?: { name?: string | null } | null;
};

type TypeOption = {
  value: string;
  label: string;
};

type ImportResolution = {
  rowKey: string;
  partCode?: string;
  type: string;
  purchasePriceCny?: number | null;
  sellingPriceCny?: number | null;
};

function partKey(code: string, type: string, brand = "") {
  return `${normalizeKey(code)}::${type}::${normalizeKey(brand)}`;
}

function sameNumber(left: unknown, right: unknown) {
  if (left == null || right == null) return false;
  return Number(left) === Number(right);
}

function findPriceMatchedPart(row: ParsedOrderRow, parts: PartWithRelations[]) {
  if (row.purchasePriceCny == null) return undefined;
  const matches = parts.filter((part) => (
    sameNumber(part.purchasePriceCny, row.purchasePriceCny) ||
    sameNumber(part.wholesalePriceCny, row.purchasePriceCny) ||
    sameNumber(part.sellingPriceCny, row.purchasePriceCny)
  ));
  return matches.length === 1 ? matches[0] : undefined;
}

function findCatalogPartForRow(
  row: ParsedOrderRow,
  partsByKey: Map<string, PartWithRelations>,
  partsByCode: Map<string, PartWithRelations[]>
) {
  const exactPart = partsByKey.get(partKey(row.partCode, row.type, row.brand));
  if (exactPart) return exactPart;

  const sameCode = partsByCode.get(normalizeKey(row.partCode)) ?? [];
  const sameType = sameCode.filter((part) => part.type === row.type);
  if (!sameType.length || row.brand) return undefined;

  if (sameType.length === 1) return sameType[0];
  return findPriceMatchedPart(row, sameType);
}

const HEADER_ALIASES = {
  partCode: [
    "part code",
    "part number",
    "parts number",
    "part no",
    "part no.",
    "article",
    "artikuly",
    "artikul",
    "артикул",
    "номер запчаста",
    "номер запчасти",
    "мнемонический код",
    "助记码",
    "图号",
    "型号",
    "code",
    "qism kodi",
    "qism code",
    "qism raqami",
    "qism nomeri",
    "kod",
    "零件编号",
    "产品编号",
  ],
  partName: ["name", "part name", "product name", "nomi", "qism nomi", "название", "имя", "产品名称", "名称"],
  categoryName: ["category", "kategoriya", "分类"],
  brand: ["brand", "brend", "бренд", "品牌"],
  type: ["type", "quality", "turi", "sifat", "оригинал", "бренд", "质量", "类型"],
  purchasePriceCny: [
    "purchase price",
    "purchase price cny",
    "price",
    "narx",
    "цена",
    "цена cny",
    "narxi",
    "xarid narxi",
    "xarid narxi ¥",
    "xarid narxi (¥)",
    "unit price",
    "unit price cny",
    "价格",
    "单价",
    "单价（人民币）",
  ],
  wholesalePriceCny: ["wholesale price", "wholesale price cny", "ulgurji narx", "ulgurji narx (¥)"],
  sellingPriceCny: ["selling price", "selling price cny", "sale price", "sotuv narxi", "sotuv narxi (¥)"],
  supplierName: ["supplier", "supplier name", "seller", "sotuvchi", "ta'minotchi", "taminotchi", "yetkazib beruvchi", "продавец", "供应商", "卖家"],
  quantity: ["qty", "quantity", "order", "miqdor", "soni", "заказ", "数量"],
  note: ["note", "notes", "izoh", "eslatma", "备注"],
} as const;

const TYPE_ALIASES: Record<string, string> = {
  original: "original",
  orginal: "original",
  oem: "oem",
  copy: "copy",
  kopiya: "copy",
  aftermarket: "aftermarket",
  analog: "aftermarket",
  analogue: "aftermarket",
  "原厂": "original",
  "副厂": "copy",
  "代用": "aftermarket",
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[№#]/g, "no");
}

function headerMatches(header: string, alias: string) {
  const normalizedAlias = normalizeHeader(alias);
  return header === normalizedAlias || header.includes(normalizedAlias) || normalizedAlias.includes(header);
}

function normalizeCode(value: unknown) {
  return String(value ?? "").trim().replace(/[‐‑‒–—―]/g, "-");
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function toNumber(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const withoutCurrency = String(value)
    .replace(/[¥₽$\s]/g, "")
    .replace(/[^\d,.-]/g, "");
  const normalized = withoutCurrency.includes(",") && !withoutCurrency.includes(".")
    ? withoutCurrency.replace(",", ".")
    : withoutCurrency.replace(/,/g, "");
  if (!normalized || normalized === "-" || normalized === ".") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toQuantity(value: unknown) {
  const parsed = toNumber(value);
  return parsed && parsed > 0 ? Math.max(1, Math.floor(parsed)) : 1;
}

function normalizeType(value: unknown) {
  const raw = text(value);
  if (!raw) return "";
  return TYPE_ALIASES[raw.toLowerCase()] ?? TYPE_ALIASES[raw] ?? raw;
}

function isValidType(value: string, typeOptions: TypeOption[]) {
  return typeOptions.some((option) => option.value === value);
}

function findHeaderRow(rows: unknown[][]) {
  let bestIndex = -1;
  let bestScore = 0;

  rows.slice(0, 30).forEach((row, index) => {
    const values = row.map(normalizeHeader);
    const score = Object.values(HEADER_ALIASES).reduce((sum, aliases) => (
      sum + (aliases.some((alias) => values.some((value) => headerMatches(value, alias))) ? 1 : 0)
    ), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore > 0 ? bestIndex : -1;
}

function buildColumnMap(headers: unknown[]) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const columnMap = new Map<keyof typeof HEADER_ALIASES, number>();

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<[keyof typeof HEADER_ALIASES, readonly string[]]>) {
    const index = normalizedHeaders.findIndex((header) => aliases.some((alias) => headerMatches(header, alias)));
    if (index >= 0) columnMap.set(field, index);
  }

  return columnMap;
}

function getCell(row: unknown[], columnMap: Map<keyof typeof HEADER_ALIASES, number>, field: keyof typeof HEADER_ALIASES) {
  const index = columnMap.get(field);
  return index == null ? undefined : row[index];
}

function parseWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const headerIndex = findHeaderRow(rows);
  if (headerIndex < 0) return [];

  const columnMap = buildColumnMap(rows[headerIndex]);
  if (!columnMap.has("partCode")) return [];

  const parsedRows = rows.slice(headerIndex + 1).map((row, index): ParsedOrderRow | null => {
    const partCode = normalizeCode(getCell(row, columnMap, "partCode"));
    if (!partCode) return null;
    const lowerCode = partCode.toLowerCase();
    if (["jami:", "jami", "total", "合计"].includes(lowerCode)) return null;

    return {
      rowKey: `${index}-${partCode}`,
      partCode,
      partName: text(getCell(row, columnMap, "partName")),
      categoryName: text(getCell(row, columnMap, "categoryName")),
      brand: text(getCell(row, columnMap, "brand")),
      type: normalizeType(getCell(row, columnMap, "type")),
      purchasePriceCny: toNumber(getCell(row, columnMap, "purchasePriceCny")),
      wholesalePriceCny: toNumber(getCell(row, columnMap, "wholesalePriceCny")),
      sellingPriceCny: toNumber(getCell(row, columnMap, "sellingPriceCny")),
      supplierName: text(getCell(row, columnMap, "supplierName")),
      quantity: toQuantity(getCell(row, columnMap, "quantity")),
      note: text(getCell(row, columnMap, "note")),
    };
  });

  return parsedRows.filter(Boolean) as ParsedOrderRow[];
}

function mapByName<T extends { id: string; name: string }>(entries: T[]) {
  return new Map(entries.map((entry) => [normalizeKey(entry.name), entry]));
}

function buildTypeOptions(rawOptions: Array<{ value: string; label: string }>) {
  if (rawOptions.length) {
    return rawOptions.map((option) => ({ value: option.value, label: option.label }));
  }

  return [
    { value: "original", label: "Original" },
    { value: "oem", label: "OEM" },
    { value: "aftermarket", label: "Aftermarket" },
    { value: "copy", label: "Copy" },
  ];
}

function applyResolutions(rows: ParsedOrderRow[], resolutions: ImportResolution[]) {
  const resolutionByRowKey = new Map(resolutions.map((resolution) => [resolution.rowKey, resolution]));
  const typesByCode = new Map<string, Set<string>>();
  for (const resolution of resolutions) {
    if (!resolution.partCode || !resolution.type) continue;
    const key = normalizeKey(resolution.partCode);
    typesByCode.set(key, new Set([...(typesByCode.get(key) ?? []), resolution.type]));
  }
  const typeByCode = new Map(
    [...typesByCode.entries()]
      .filter(([, types]) => types.size === 1)
      .map(([code, types]) => [code, [...types][0]])
  );
  return rows.map((row) => ({
    ...row,
    type: resolutionByRowKey.get(row.rowKey)?.type || typeByCode.get(normalizeKey(row.partCode)) || row.type || "",
    purchasePriceCny: resolutionByRowKey.has(row.rowKey)
      ? resolutionByRowKey.get(row.rowKey)?.purchasePriceCny ?? null
      : row.purchasePriceCny,
    sellingPriceCny: resolutionByRowKey.has(row.rowKey)
      ? resolutionByRowKey.get(row.rowKey)?.sellingPriceCny ?? null
      : row.sellingPriceCny,
  }));
}

function getResolutionIssues(
  rows: ParsedOrderRow[],
  partsByKey: Map<string, PartWithRelations>,
  partsByCode: Map<string, PartWithRelations[]>,
  typeOptions: TypeOption[]
) {
  return rows.flatMap((row) => {
    const hasValidType = row.type && isValidType(row.type, typeOptions);
    const exactPart = hasValidType ? partsByKey.get(partKey(row.partCode, row.type, row.brand)) : undefined;
    if (exactPart) return [];

    const matchingParts = partsByCode.get(normalizeKey(row.partCode)) ?? [];
    const priceMatchedPart = findPriceMatchedPart(row, matchingParts);
    const existingTypes = matchingParts.map((part) => part.type).filter(Boolean);
    const existingPart = priceMatchedPart ?? matchingParts[0];
    if (hasValidType) return [];

    return [{
      rowKey: row.rowKey,
      partCode: row.partCode,
      partName: row.partName || existingPart?.name || "",
      quantity: row.quantity,
      price: row.purchasePriceCny,
      purchasePriceCny: existingPart?.purchasePriceCny != null ? Number(existingPart.purchasePriceCny) : row.purchasePriceCny,
      sellingPriceCny: row.sellingPriceCny ?? row.purchasePriceCny ?? (existingPart?.sellingPriceCny != null ? Number(existingPart.sellingPriceCny) : null),
      existingType: existingPart?.type ?? "",
      existingTypes,
      isNewPart: !existingPart,
      reason: row.type ? "unknown_type" : "missing_type",
    }];
  });
}

async function loadImportContext() {
  const [families, existingVariants, categories, suppliers, rawTypeOptions] = await Promise.all([
    prisma.part.findMany({
      include: { category: true },
    }),
    prisma.partVariant.findMany({
      include: { part: { include: { category: true } }, supplier: true },
    }),
    prisma.category.findMany(),
    prisma.supplier.findMany(),
    prisma.settingOption.findMany({
      where: { kind: "part_quality_type" },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
  ]);

  return {
    families,
    existingParts: existingVariants.map((variant) => ({
      ...variant,
      partId: variant.partId,
      code: variant.part.code,
      name: variant.part.name,
      category: variant.part.category,
      categoryName: variant.part.category?.name,
    })),
    categories,
    suppliers,
    typeOptions: buildTypeOptions(rawTypeOptions),
  };
}

async function finalizeImport(parsedRows: ParsedOrderRow[], resolutions: ImportResolution[] = []) {
  const { families, existingParts, categories, suppliers, typeOptions } = await loadImportContext();
  const rows = applyResolutions(parsedRows, resolutions);
  const categoryByName = mapByName(categories);
  const supplierByName = mapByName(suppliers);
  const familiesByCode = new Map<string, PartFamily>(
    (families as PartFamily[]).map((family) => [normalizeKey(family.code), family])
  );
  const partsByKey = new Map<string, PartWithRelations>(
    existingParts.map((part) => [partKey(part.code, part.type, part.brand ?? ""), part])
  );
  const partsByCode = new Map<string, PartWithRelations[]>();
  for (const part of existingParts) {
    const key = normalizeKey(part.code);
    partsByCode.set(key, [...(partsByCode.get(key) ?? []), part]);
  }
  const issues = getResolutionIssues(rows, partsByKey, partsByCode, typeOptions);

  if (issues.length) {
    return {
      requiresResolution: true,
      rows,
      issues,
      typeOptions,
      summary: {
        parsedCount: rows.length,
        createdCount: 0,
        existingCount: rows.filter((row) => partsByKey.has(partKey(row.partCode, row.type, row.brand))).length,
        createdCodes: [],
      },
    };
  }

  const createdCodes: string[] = [];
  const createdVariantKeys = new Set<string>();
  const partByRowKey = new Map<string, PartWithRelations>();

  for (const row of rows) {
    const key = partKey(row.partCode, row.type, row.brand);
    const existingPart = findCatalogPartForRow(row, partsByKey, partsByCode);
    if (existingPart) {
      partByRowKey.set(row.rowKey, existingPart);
      continue;
    }

    const category = row.categoryName ? categoryByName.get(normalizeKey(row.categoryName)) : undefined;
    const supplier = row.supplierName ? supplierByName.get(normalizeKey(row.supplierName)) : undefined;

    let family = familiesByCode.get(normalizeKey(row.partCode));
    if (!family) {
      const createdFamily = await prisma.part.create({
        data: {
          code: row.partCode,
          name: row.partName || null,
          categoryId: category?.id ?? null,
        },
        include: { category: true },
      }) as PartFamily;
      family = createdFamily;
      familiesByCode.set(normalizeKey(family.code), family);
    }

    const created = await prisma.partVariant.create({
      data: {
        partId: family.id,
        brand: row.brand || null,
        type: row.type,
        purchasePriceCny: row.purchasePriceCny,
        wholesalePriceCny: row.wholesalePriceCny,
        sellingPriceCny: row.sellingPriceCny ?? row.purchasePriceCny,
        supplierId: supplier?.id ?? null,
        note: row.note || null,
      },
      include: { part: { include: { category: true } }, supplier: true },
    });
    const flatCreated = {
      ...created,
      code: created.part.code,
      name: created.part.name,
      category: created.part.category,
      categoryName: created.part.category?.name,
    };
    partsByKey.set(key, flatCreated);
    partsByCode.set(normalizeKey(flatCreated.code), [...(partsByCode.get(normalizeKey(flatCreated.code)) ?? []), flatCreated]);
    partByRowKey.set(row.rowKey, flatCreated);
    createdVariantKeys.add(row.rowKey);
    createdCodes.push(`${flatCreated.code} (${created.brand || "brend yo'q"} / ${created.type})`);
  }

  if (createdCodes.length) revalidateAppData("parts");

  const importedAt = Date.now();
  const items = rows.map((row, index) => {
    const key = partKey(row.partCode, row.type, row.brand);
    const part = partByRowKey.get(row.rowKey) ?? partsByKey.get(key);
    const isCreatedVariant = createdVariantKeys.has(row.rowKey);
    const catalogPurchasePrice = part?.purchasePriceCny != null ? Number(part.purchasePriceCny) : null;
    const catalogWholesalePrice = part?.wholesalePriceCny != null ? Number(part.wholesalePriceCny) : null;
    const excelSellingPrice = row.sellingPriceCny ?? row.purchasePriceCny;

    return {
      localId: `import-${importedAt}-${index}`,
      partId: part?.partId ?? "",
      partVariantId: part?.id ?? "",
      partCode: part?.code ?? row.partCode,
      partName: row.partName || part?.name || "",
      categoryName: row.categoryName || part?.category?.name || "",
      brand: row.brand || part?.brand || "",
      type: row.type,
      purchasePriceCny: isCreatedVariant ? row.purchasePriceCny ?? catalogPurchasePrice : catalogPurchasePrice ?? row.purchasePriceCny,
      wholesalePriceCny: isCreatedVariant ? row.wholesalePriceCny ?? catalogWholesalePrice : catalogWholesalePrice ?? row.wholesalePriceCny,
      sellingPriceCny: excelSellingPrice,
      supplierId: part?.supplierId ?? "",
      supplierName: row.supplierName || part?.supplier?.name || "",
      quantity: row.quantity,
      note: row.note,
    };
  });

  return {
    requiresResolution: false,
    items,
    summary: {
      parsedCount: rows.length,
      createdCount: createdCodes.length,
      existingCount: rows.length - createdCodes.length,
      createdCodes,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminOrManager();
  } catch {
    return unauthorized();
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (!Array.isArray(body.rows)) {
        return Response.json({ error: "Import qatorlari yuborilmadi" }, { status: 400 });
      }
      return Response.json(await finalizeImport(body.rows, body.resolutions ?? []));
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return Response.json({ error: "Excel fayl yuborilmadi" }, { status: 400 });
    }

    const parsedRows = parseWorkbook(await file.arrayBuffer());
    if (!parsedRows.length) {
      return Response.json({ error: "Excel ichidan part number ustuni topilmadi" }, { status: 400 });
    }
    return Response.json(await finalizeImport(parsedRows));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Excel import qilishda xatolik yuz berdi";
    return Response.json({ error: message }, { status: 500 });
  }
}

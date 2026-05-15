import { prisma } from "@/lib/prisma";
import { revalidateAppData } from "@/lib/data";
import type { ImportResolution, ParsedOrderRow, PartFamily, PartWithRelations } from "./types";
import {
  addPartToIndexes,
  buildPartIndexes,
  buildTypeOptions,
  findCatalogPartForRow,
  mapByName,
  partKey,
} from "./catalog";
import { applyResolutions, getResolutionIssues } from "./resolution";
import { buildImportedItems } from "./imported-items";
import { normalizeKey } from "./normalization";

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

export async function finalizeImport(parsedRows: ParsedOrderRow[], resolutions: ImportResolution[] = []) {
  const { families, existingParts, categories, suppliers, typeOptions } = await loadImportContext();
  const rows = applyResolutions(parsedRows, resolutions);
  const categoryByName = mapByName(categories);
  const supplierByName = mapByName(suppliers);
  const familiesByCode = new Map<string, PartFamily>(
    (families as PartFamily[]).map((family) => [normalizeKey(family.code), family])
  );
  const { partsByKey, partsByCode } = buildPartIndexes(existingParts);
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
    const existingPart = findCatalogPartForRow(row, partsByKey, partsByCode);
    if (existingPart) {
      partByRowKey.set(row.rowKey, existingPart);
      continue;
    }

    const createdPart = await createCatalogPart(row, categoryByName, supplierByName, familiesByCode);
    addPartToIndexes(createdPart, partsByKey, partsByCode);
    partByRowKey.set(row.rowKey, createdPart);
    createdVariantKeys.add(row.rowKey);
    createdCodes.push(`${createdPart.code} (${createdPart.brand || "brend yo'q"} / ${createdPart.type})`);
  }

  if (createdCodes.length) revalidateAppData("parts");

  return {
    requiresResolution: false,
    items: buildImportedItems(rows, partsByKey, partByRowKey, createdVariantKeys),
    summary: {
      parsedCount: rows.length,
      createdCount: createdCodes.length,
      existingCount: rows.length - createdCodes.length,
      createdCodes,
    },
  };
}

async function createCatalogPart(
  row: ParsedOrderRow,
  categoryByName: Map<string, { id: string; name: string }>,
  supplierByName: Map<string, { id: string; name: string }>,
  familiesByCode: Map<string, PartFamily>
) {
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

  return {
    ...created,
    code: created.part.code,
    name: created.part.name,
    category: created.part.category,
    categoryName: created.part.category?.name,
  };
}

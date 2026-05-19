import { prisma } from "@/lib/prisma";
import { normalizePartCodeAlias } from "@/lib/part-code-normalization";
import type { ImportResolution, ImportWarning, ParsedOrderRow, PartFamily, PartWithRelations } from "./types";
import {
  buildPartIndexes,
  buildTypeOptions,
  findCatalogPartForRow,
  partKey,
} from "./catalog";
import { applyResolutions, getResolutionIssues } from "./resolution";
import { buildImportedItems } from "./imported-items";
import { normalizeKey } from "./normalization";

async function loadImportContext() {
  const [families, existingVariants, categories, suppliers, rawTypeOptions] = await Promise.all([
    prisma.part.findMany({
      include: { category: true, codeAliases: true },
    }),
    prisma.partVariant.findMany({
      include: {
        part: { include: { category: true } },
        supplierPrices: { include: { supplier: true }, orderBy: [{ purchasePriceCny: "asc" }, { createdAt: "asc" }] },
      },
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
  const { families, existingParts, typeOptions } = await loadImportContext();
  const rows = applyResolutions(parsedRows, resolutions);
  const typedFamilies = families as PartFamily[];
  const { partsByKey, partsByCode, partsByAlias, partsByName } = buildPartIndexes(existingParts, typedFamilies);
  const issues = getResolutionIssues(rows, partsByKey, partsByCode, typeOptions, partsByAlias, partsByName);
  const warnings = buildImportWarnings(rows, typedFamilies, partsByCode, partsByAlias, partsByName);

  if (issues.length) {
    return {
      requiresResolution: true,
      rows,
      issues,
      typeOptions,
      warnings,
      summary: {
        parsedCount: rows.length,
        createdCount: 0,
        existingCount: rows.filter((row) => partsByKey.has(partKey(row.partCode, row.type, row.brand))).length,
        createdCodes: [],
      },
    };
  }

  const pendingCodes: string[] = [];
  const partByRowKey = new Map<string, PartWithRelations>();

  for (const row of rows) {
    const existingPart = findCatalogPartForRow(row, partsByKey, partsByCode, partsByAlias, partsByName);
    if (existingPart) {
      partByRowKey.set(row.rowKey, existingPart);
      continue;
    }

    pendingCodes.push(`${row.partCode} (${row.brand || "brend yo'q"} / ${row.type})`);
  }

  return {
    requiresResolution: false,
    items: buildImportedItems(rows, partsByKey, partByRowKey),
    warnings,
    summary: {
      parsedCount: rows.length,
      createdCount: pendingCodes.length,
      existingCount: rows.length - pendingCodes.length,
      createdCodes: pendingCodes,
    },
  };
}

function buildImportWarnings(
  rows: ParsedOrderRow[],
  families: PartFamily[],
  partsByCode: Map<string, PartWithRelations[]>,
  partsByAlias: Map<string, PartWithRelations[]>,
  partsByName: Map<string, PartWithRelations[]>
) {
  const familyById = new Map(families.map((family) => [family.id, family]));
  const warnings: ImportWarning[] = [];

  for (const row of rows) {
    const normalizedCode = normalizePartCodeAlias(row.partCode);
    const aliasMatches = partsByAlias.get(normalizedCode) ?? [];
    const exactMatches = partsByCode.get(normalizeKey(row.partCode)) ?? [];
    if (!exactMatches.length && aliasMatches.length) {
      const family = familyById.get(aliasMatches[0].partId);
      warnings.push({
        rowKey: row.rowKey,
        partCode: row.partCode,
        partName: row.partName,
        reason: "possible_duplicate_code",
        message: `${row.partCode} kodi ${family?.code ?? aliasMatches[0].code} bilan alias orqali bog'landi.`,
        suggestedAction: "Agar bu bog'lanish noto'g'ri bo'lsa, zapchast aliasini tekshiring.",
        matchingPart: family ? { partId: family.id, code: family.code, name: family.name } : undefined,
      });
      continue;
    }

    const nameMatches = partsByName.get(normalizeKey(row.partName || row.partCode)) ?? [];
    if (!exactMatches.length && !aliasMatches.length && nameMatches.length) {
      const family = familyById.get(nameMatches[0].partId);
      warnings.push({
        rowKey: row.rowKey,
        partCode: row.partCode,
        partName: row.partName,
        reason: "possible_duplicate_name",
        message: `${row.partCode} kodi topilmadi, lekin nomi ${family?.code ?? nameMatches[0].code} zapchastiga o'xshaydi.`,
        suggestedAction: "Agar bu bitta zapchast bo'lsa, part listdan alias qo'shing.",
        matchingPart: family ? { partId: family.id, code: family.code, name: family.name } : undefined,
      });
    }
  }

  return warnings;
}

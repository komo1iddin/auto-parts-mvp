import type { ImportResolution, ParsedOrderRow, PartWithRelations, TypeOption } from "./types";
import { findCatalogPartForRow, findPriceMatchedPart, partKey } from "./catalog";
import { normalizeKey } from "./normalization";

export function applyResolutions(rows: ParsedOrderRow[], resolutions: ImportResolution[]) {
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

export function getResolutionIssues(
  rows: ParsedOrderRow[],
  partsByKey: Map<string, PartWithRelations>,
  partsByCode: Map<string, PartWithRelations[]>,
  typeOptions: TypeOption[],
  partsByAlias = new Map<string, PartWithRelations[]>(),
  partsByName = new Map<string, PartWithRelations[]>()
) {
  return rows.flatMap((row) => {
    const hasValidType = row.type && isValidType(row.type, typeOptions);
    const exactPart = hasValidType ? partsByKey.get(partKey(row.partCode, row.type, row.brand)) : undefined;
    if (exactPart) return [];

    const catalogPart = findCatalogPartForRow(row, partsByKey, partsByCode, partsByAlias, partsByName);
    const matchingParts = catalogPart ? [catalogPart] : (partsByCode.get(normalizeKey(row.partCode)) ?? []);
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
      purchasePriceCny: existingPart?.supplierPrices?.[0]?.purchasePriceCny != null
        ? Number(existingPart.supplierPrices[0].purchasePriceCny)
        : row.purchasePriceCny,
      sellingPriceCny: row.sellingPriceCny ?? row.purchasePriceCny ?? (existingPart?.sellingPriceCny != null ? Number(existingPart.sellingPriceCny) : null),
      existingType: existingPart?.type ?? "",
      existingTypes,
      isNewPart: !existingPart,
      reason: row.type ? "unknown_type" : "missing_type",
    }];
  });
}

function isValidType(value: string, typeOptions: TypeOption[]) {
  return typeOptions.some((option) => option.value === value);
}

import type { ParsedOrderRow, PartWithRelations } from "./types";
import { normalizeKey } from "./normalization";
import { normalizePartCodeAlias } from "@/lib/part-code-normalization";

export function partKey(code: string, type: string, brand = "") {
  return `${normalizeKey(code)}::${type}::${normalizeKey(brand)}`;
}

export function mapByName<T extends { id: string; name: string }>(entries: T[]) {
  return new Map(entries.map((entry) => [normalizeKey(entry.name), entry]));
}

export function buildTypeOptions(rawOptions: Array<{ value: string; label: string }>) {
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

export function buildPartIndexes(parts: PartWithRelations[], families: Array<{
  id: string;
  code: string;
  name?: string | null;
  codeAliases?: Array<{ code: string; normalizedCode: string }>;
}> = []) {
  const partsByKey = new Map<string, PartWithRelations>(
    parts.map((part) => [partKey(part.code, part.type, part.brand ?? ""), part])
  );
  const partsByCode = new Map<string, PartWithRelations[]>();
  const partsByAlias = new Map<string, PartWithRelations[]>();
  const partsByName = new Map<string, PartWithRelations[]>();
  const partIdsByNormalizedCode = new Map<string, Set<string>>();

  for (const family of families) {
    const keys = [
      normalizePartCodeAlias(family.code),
      ...(family.codeAliases ?? []).map((alias) => alias.normalizedCode || normalizePartCodeAlias(alias.code)),
    ].filter(Boolean);
    for (const key of keys) {
      partIdsByNormalizedCode.set(key, new Set([...(partIdsByNormalizedCode.get(key) ?? []), family.id]));
    }
  }

  for (const part of parts) {
    const key = normalizeKey(part.code);
    partsByCode.set(key, [...(partsByCode.get(key) ?? []), part]);
    const nameKey = normalizeKey(part.name ?? "");
    if (nameKey) partsByName.set(nameKey, [...(partsByName.get(nameKey) ?? []), part]);
  }

  for (const part of parts) {
    const normalizedCode = normalizePartCodeAlias(part.code);
    const aliasPartIds = partIdsByNormalizedCode.get(normalizedCode) ?? new Set([part.partId]);
    for (const partId of aliasPartIds) {
      const family = families.find((entry) => entry.id === partId);
      if (!family) continue;
      const keys = [
        normalizePartCodeAlias(family.code),
        ...(family.codeAliases ?? []).map((alias) => alias.normalizedCode || normalizePartCodeAlias(alias.code)),
      ].filter(Boolean);
      for (const key of keys) {
        partsByAlias.set(key, [...(partsByAlias.get(key) ?? []), part]);
      }
    }
  }

  return { partsByKey, partsByCode, partsByAlias, partsByName };
}

export function addPartToIndexes(
  part: PartWithRelations,
  partsByKey: Map<string, PartWithRelations>,
  partsByCode: Map<string, PartWithRelations[]>
) {
  const codeKey = normalizeKey(part.code);
  partsByKey.set(partKey(part.code, part.type, part.brand ?? ""), part);
  partsByCode.set(codeKey, [...(partsByCode.get(codeKey) ?? []), part]);
}

export function findCatalogPartForRow(
  row: ParsedOrderRow,
  partsByKey: Map<string, PartWithRelations>,
  partsByCode: Map<string, PartWithRelations[]>,
  partsByAlias = new Map<string, PartWithRelations[]>(),
  partsByName = new Map<string, PartWithRelations[]>()
) {
  const exactPart = partsByKey.get(partKey(row.partCode, row.type, row.brand));
  if (exactPart) return exactPart;

  const sameCode = [
    ...(partsByCode.get(normalizeKey(row.partCode)) ?? []),
    ...(partsByAlias.get(normalizePartCodeAlias(row.partCode)) ?? []),
  ];
  const codeMatch = findBestPart(row, sameCode);
  if (codeMatch) return codeMatch;

  const sameName = partsByName.get(normalizeKey(row.partName || row.partCode)) ?? [];
  const nameMatch = findBestPart(row, sameName);
  if (nameMatch) return nameMatch;

  return undefined;
}

function findBestPart(row: ParsedOrderRow, parts: PartWithRelations[]) {
  const uniqueParts = [...new Map(parts.map((part) => [part.id, part])).values()];
  const exactPart = uniqueParts.find((part) => (
    part.type === row.type && normalizeKey(part.brand ?? "") === normalizeKey(row.brand)
  ));
  if (exactPart) return exactPart;

  const priceMatchedPart = row.brand ? undefined : findPriceMatchedPart(row, uniqueParts);
  if (priceMatchedPart) return priceMatchedPart;

  const sameType = uniqueParts.filter((part) => part.type === row.type);
  if (!sameType.length || row.brand) return undefined;

  if (sameType.length === 1) return sameType[0];
  return findPriceMatchedPart(row, sameType);
}

function sameNumber(left: unknown, right: unknown) {
  if (left == null || right == null) return false;
  return Number(left) === Number(right);
}

export function findPriceMatchedPart(row: ParsedOrderRow, parts: PartWithRelations[]) {
  if (row.purchasePriceCny == null) return undefined;
  const matches = parts.filter((part) => (
    sameNumber(part.sellingPriceCny, row.purchasePriceCny) ||
    (part.supplierPrices ?? []).some((price) => (
      sameNumber(price.purchasePriceCny, row.purchasePriceCny) ||
      sameNumber(price.wholesalePriceCny, row.purchasePriceCny)
    ))
  ));
  return matches.length === 1 ? matches[0] : undefined;
}

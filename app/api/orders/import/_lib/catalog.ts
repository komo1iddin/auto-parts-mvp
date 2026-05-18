import type { ParsedOrderRow, PartWithRelations } from "./types";
import { normalizeKey } from "./normalization";

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

export function buildPartIndexes(parts: PartWithRelations[]) {
  const partsByKey = new Map<string, PartWithRelations>(
    parts.map((part) => [partKey(part.code, part.type, part.brand ?? ""), part])
  );
  const partsByCode = new Map<string, PartWithRelations[]>();

  for (const part of parts) {
    const key = normalizeKey(part.code);
    partsByCode.set(key, [...(partsByCode.get(key) ?? []), part]);
  }

  return { partsByKey, partsByCode };
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
  partsByCode: Map<string, PartWithRelations[]>
) {
  const exactPart = partsByKey.get(partKey(row.partCode, row.type, row.brand));
  if (exactPart) return exactPart;

  const sameCode = partsByCode.get(normalizeKey(row.partCode)) ?? [];
  const priceMatchedPart = row.brand ? undefined : findPriceMatchedPart(row, sameCode);
  if (priceMatchedPart) return priceMatchedPart;

  const sameType = sameCode.filter((part) => part.type === row.type);
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
    sameNumber(part.purchasePriceCny, row.purchasePriceCny) ||
    sameNumber(part.wholesalePriceCny, row.purchasePriceCny) ||
    sameNumber(part.sellingPriceCny, row.purchasePriceCny)
  ));
  return matches.length === 1 ? matches[0] : undefined;
}

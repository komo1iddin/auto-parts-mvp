import * as XLSX from "xlsx";
import type { ParsedOrderRow } from "./types";
import { normalizeCode, normalizeHeader, text, toNumber, toQuantity } from "./normalization";
import { HEADER_ALIASES, TYPE_ALIASES, type HeaderField } from "./workbook-aliases";

function headerMatches(header: string, alias: string) {
  const normalizedAlias = normalizeHeader(alias);
  return header === normalizedAlias || header.includes(normalizedAlias) || normalizedAlias.includes(header);
}

function normalizeType(value: unknown) {
  const raw = text(value);
  if (!raw) return "";
  return TYPE_ALIASES[raw.toLowerCase()] ?? TYPE_ALIASES[raw] ?? raw;
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
  const columnMap = new Map<HeaderField, number>();

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<[HeaderField, readonly string[]]>) {
    const index = normalizedHeaders.findIndex((header) => aliases.some((alias) => headerMatches(header, alias)));
    if (index >= 0) columnMap.set(field, index);
  }

  return columnMap;
}

function getCell(row: unknown[], columnMap: Map<HeaderField, number>, field: HeaderField) {
  const index = columnMap.get(field);
  return index == null ? undefined : row[index];
}

function parseRow(row: unknown[], columnMap: Map<HeaderField, number>, index: number): ParsedOrderRow | null {
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
}

export function parseWorkbook(buffer: ArrayBuffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!sheet) return [];

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const headerIndex = findHeaderRow(rows);
  if (headerIndex < 0) return [];

  const columnMap = buildColumnMap(rows[headerIndex]);
  if (!columnMap.has("partCode")) return [];

  return rows
    .slice(headerIndex + 1)
    .map((row, index) => parseRow(row, columnMap, index))
    .filter(Boolean) as ParsedOrderRow[];
}

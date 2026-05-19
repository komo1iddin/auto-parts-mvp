import type { ParsedOrderRow } from "./types";
import { normalizeCode, toNumber, toQuantity } from "./normalization";

const CLIPBOARD_ROW_RE = /^(.+?)\s*(?:[-:]\s*)?([0-9]+(?:[.,][0-9]+)?)\s*[*xX×хХ]\s*([0-9]+(?:[.,][0-9]+)?)\s*$/;

export function parseClipboardOrderText(value: unknown): ParsedOrderRow[] {
  if (typeof value !== "string") return [];

  return value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/[‐‑‒–—―]/g, "-"))
    .flatMap((line, index) => {
      const match = line.match(CLIPBOARD_ROW_RE);
      if (!match) return [];

      const partCode = normalizeCode(match[1]);
      const purchasePriceCny = toNumber(match[2]);
      if (!partCode || purchasePriceCny == null) return [];

      return [{
        rowKey: `clipboard-${index}-${partCode}`,
        partCode,
        partName: "",
        categoryName: "",
        brand: "",
        type: "",
        purchasePriceCny,
        wholesalePriceCny: null,
        sellingPriceCny: purchasePriceCny,
        supplierName: "",
        quantity: toQuantity(match[3]),
        note: "",
      }];
    });
}

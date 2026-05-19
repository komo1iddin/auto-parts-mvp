import type { ParsedOrderRow, PartWithRelations } from "./types";
import { partKey } from "./catalog";

function bestSupplierPrice(part?: PartWithRelations | null) {
  return part?.supplierPrices?.[0] ?? null;
}

export function buildImportedItems(
  rows: ParsedOrderRow[],
  partsByKey: Map<string, PartWithRelations>,
  partByRowKey: Map<string, PartWithRelations>
) {
  const importedAt = Date.now();

  return rows.map((row, index) => {
    const key = partKey(row.partCode, row.type, row.brand);
    const part = partByRowKey.get(row.rowKey) ?? partsByKey.get(key);
    const offer = bestSupplierPrice(part);
    const catalogPurchasePrice = offer?.purchasePriceCny != null ? Number(offer.purchasePriceCny) : null;
    const catalogWholesalePrice = offer?.wholesalePriceCny != null ? Number(offer.wholesalePriceCny) : null;
    const excelSellingPrice = row.sellingPriceCny ?? row.purchasePriceCny;

    return {
      localId: `import-${importedAt}-${index}`,
      partId: part?.partId ?? "",
      partVariantId: part?.id ?? "",
      partSupplierPriceId: offer?.id ?? "",
      partCode: part?.code ?? row.partCode,
      partName: row.partName || part?.name || "",
      categoryName: row.categoryName || part?.category?.name || "",
      brand: row.brand || part?.brand || "",
      type: row.type,
      purchasePriceCny: catalogPurchasePrice ?? row.purchasePriceCny,
      wholesalePriceCny: catalogWholesalePrice ?? row.wholesalePriceCny,
      sellingPriceCny: excelSellingPrice,
      supplierId: offer?.supplierId ?? "",
      supplierName: offer?.supplier?.name || "",
      quantity: row.quantity,
      note: row.note,
    };
  });
}

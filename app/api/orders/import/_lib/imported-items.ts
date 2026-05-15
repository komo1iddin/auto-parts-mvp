import type { ParsedOrderRow, PartWithRelations } from "./types";
import { partKey } from "./catalog";

export function buildImportedItems(
  rows: ParsedOrderRow[],
  partsByKey: Map<string, PartWithRelations>,
  partByRowKey: Map<string, PartWithRelations>,
  createdVariantKeys: Set<string>
) {
  const importedAt = Date.now();

  return rows.map((row, index) => {
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
}

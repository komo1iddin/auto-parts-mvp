export type ParsedOrderRow = {
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

export type PartWithRelations = {
  id: string;
  partId: string;
  code: string;
  name?: string | null;
  categoryName?: string | null;
  brand?: string | null;
  type: string;
  sellingPriceCny?: unknown;
  supplierPrices?: Array<{
    id: string;
    supplierId: string;
    purchasePriceCny?: unknown;
    wholesalePriceCny?: unknown;
    supplier?: { name?: string | null } | null;
  }>;
  category?: { name?: string | null } | null;
};

export type PartFamily = {
  id: string;
  code: string;
  name?: string | null;
  categoryId?: string | null;
  category?: { name?: string | null } | null;
  codeAliases?: Array<{ code: string; normalizedCode: string }>;
};

export type ImportWarning = {
  rowKey: string;
  partCode: string;
  partName: string;
  reason: "possible_duplicate_code" | "possible_duplicate_name";
  message: string;
  suggestedAction: string;
  matchingPart?: {
    partId: string;
    code: string;
    name?: string | null;
  };
};

export type TypeOption = {
  value: string;
  label: string;
};

export type ImportResolution = {
  rowKey: string;
  partCode?: string;
  type: string;
  purchasePriceCny?: number | null;
  sellingPriceCny?: number | null;
};

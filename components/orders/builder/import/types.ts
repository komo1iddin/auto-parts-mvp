import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";

export type SupplierOption = {
  id: string;
  name: string;
};

export type ImportSummary = {
  parsedCount: number;
  createdCount: number;
  existingCount: number;
  createdCodes: string[];
};

export type ImportWarning = {
  rowKey: string;
  partCode: string;
  partName: string;
  message: string;
  suggestedAction: string;
};

export type ImportRow = {
  rowKey: string;
  partCode: string;
  partName: string;
  purchasePriceCny: number | null;
  quantity: number;
  type: string;
};

export type ImportIssue = {
  rowKey: string;
  partCode: string;
  partName: string;
  quantity: number;
  price: number | null;
  purchasePriceCny: number | null;
  sellingPriceCny: number | null;
  existingType: string;
  isNewPart: boolean;
  reason: "missing_type" | "unknown_type";
};

export type TypeOption = {
  value: string;
  label: string;
};

export type PendingResolution = {
  rows: ImportRow[];
  issues: ImportIssue[];
  typeOptions: TypeOption[];
  warnings?: ImportWarning[];
};

export type ImportResponse = {
  requiresResolution?: boolean;
  items?: OrderItem[];
  summary?: ImportSummary;
  warnings?: ImportWarning[];
} & Partial<PendingResolution>;

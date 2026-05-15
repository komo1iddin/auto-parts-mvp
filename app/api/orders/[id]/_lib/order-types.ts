export type OrderRouteUser = {
  id: string;
  role: string;
};

export type IncomingOrderItem = {
  id?: string;
  partId?: string;
  partVariantId?: string;
  partCode: string;
  partName?: string;
  categoryName?: string;
  brand?: string;
  type?: string;
  purchasePriceCny?: number | null;
  wholesalePriceCny?: number | null;
  sellingPriceCny?: number | null;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity: number;
  note?: string | null;
};

export type ExistingOrderItem = IncomingOrderItem & {
  id: string;
};

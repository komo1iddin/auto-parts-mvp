export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
}

export interface Supplier {
  id: string;
  name: string;
}

export interface SettingOption {
  id: string;
  value: string;
  label: string;
}

export interface PartFormData {
  code: string;
  name: string;
  categoryId: string;
  brand: string;
  type: string;
  sellingPriceCny: string;
  supplierPrices: SupplierPriceFormData[];
  note: string;
  imageUrl: string;
}

export interface SupplierPriceFormData {
  id?: string;
  supplierId: string;
  purchasePriceCny: string;
  wholesalePriceCny: string;
  note: string;
}

export type PartFormDefaultValues = Partial<Omit<PartFormData, "supplierPrices">> & {
  id?: string;
  categoryName?: string;
  supplierName?: string;
  supplierId?: string | null;
  purchasePriceCny?: string | null;
  wholesalePriceCny?: string | null;
  supplierPrices?: Array<SupplierPrice | SupplierPriceFormData>;
};

export interface Part {
  id: string;
  partId: string;
  code: string;
  name: string | null;
  brand: string | null;
  type: string;
  sellingPriceCny: string | null;
  purchasePriceCny?: string | number | null;
  wholesalePriceCny?: string | number | null;
  bestSupplierPrice?: SupplierPrice | null;
  supplierPrices?: SupplierPrice[];
  imageUrl: string | null;
  note?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  category?: { name: string } | null;
  supplier?: { name: string } | null;
}

export interface SupplierPrice {
  id: string;
  supplierId: string;
  purchasePriceCny: string | number;
  wholesalePriceCny?: string | number | null;
  note?: string | null;
  supplier?: { id: string; name: string } | null;
}

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

export interface PartFormData {
  code: string;
  name: string;
  categoryId: string;
  brand: string;
  type: string;
  purchasePriceCny: string;
  wholesalePriceCny: string;
  sellingPriceCny: string;
  supplierId: string;
  note: string;
  imageUrl: string;
}

export type PartFormDefaultValues = Partial<PartFormData> & {
  id?: string;
  categoryName?: string;
  supplierName?: string;
};

export interface Part {
  id: string;
  code: string;
  name: string | null;
  brand: string | null;
  type: string;
  purchasePriceCny?: string | null;
  wholesalePriceCny?: string | null;
  sellingPriceCny: string | null;
  imageUrl: string | null;
  note?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  category?: { name: string } | null;
  supplier?: { name: string } | null;
}

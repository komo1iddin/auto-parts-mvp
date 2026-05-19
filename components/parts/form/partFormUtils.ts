import type { Category, PartFormData, PartFormDefaultValues } from "@/components/parts/types/parts";

export function flattenCategories(cats: Category[], prefix = ""): Category[] {
  return cats.flatMap((category) => [
    { ...category, name: prefix + category.name },
    ...flattenCategories(category.children ?? [], `${prefix}${category.name} → `),
  ]);
}

export function buildInitialPartForm(defaultValues?: PartFormDefaultValues): PartFormData {
  return {
    code: defaultValues?.code ?? "",
    name: defaultValues?.name ?? "",
    categoryId: defaultValues?.categoryId ?? "",
    brand: defaultValues?.brand ?? "",
    type: defaultValues?.type ?? "original",
    sellingPriceCny: defaultValues?.sellingPriceCny ?? "",
    supplierPrices: defaultValues?.supplierPrices?.length
      ? defaultValues.supplierPrices.map((price) => ({
          id: price.id,
          supplierId: price.supplierId,
          purchasePriceCny: price.purchasePriceCny?.toString() ?? "",
          wholesalePriceCny: price.wholesalePriceCny?.toString() ?? "",
          note: price.note ?? "",
        }))
      : [
          {
            supplierId: defaultValues?.supplierId ?? "",
            purchasePriceCny: defaultValues?.purchasePriceCny ?? "",
            wholesalePriceCny: defaultValues?.wholesalePriceCny ?? "",
            note: "",
          },
        ],
    note: defaultValues?.note ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
  };
}

export function toPartPayload(form: PartFormData) {
  return {
    ...form,
    sellingPriceCny: form.sellingPriceCny ? Number(form.sellingPriceCny) : null,
    categoryId: form.categoryId || null,
    supplierPrices: form.supplierPrices
      .filter((price) => price.supplierId && price.purchasePriceCny)
      .map((price) => ({
        ...price,
        purchasePriceCny: Number(price.purchasePriceCny),
        wholesalePriceCny: price.wholesalePriceCny ? Number(price.wholesalePriceCny) : null,
        note: price.note || null,
      })),
  };
}

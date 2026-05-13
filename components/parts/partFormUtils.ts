import type { Category, PartFormData, PartFormDefaultValues } from "@/components/parts/types";

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
    purchasePriceCny: defaultValues?.purchasePriceCny ?? "",
    wholesalePriceCny: defaultValues?.wholesalePriceCny ?? "",
    sellingPriceCny: defaultValues?.sellingPriceCny ?? "",
    supplierId: defaultValues?.supplierId ?? "",
    note: defaultValues?.note ?? "",
    imageUrl: defaultValues?.imageUrl ?? "",
  };
}

export function toPartPayload(form: PartFormData) {
  return {
    ...form,
    purchasePriceCny: form.purchasePriceCny ? Number(form.purchasePriceCny) : null,
    wholesalePriceCny: form.wholesalePriceCny ? Number(form.wholesalePriceCny) : null,
    sellingPriceCny: form.sellingPriceCny ? Number(form.sellingPriceCny) : null,
    categoryId: form.categoryId || null,
    supplierId: form.supplierId || null,
  };
}

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PART_TYPES } from "@/lib/utils";
import type { Category, PartFormData, SettingOption, Supplier } from "@/components/parts/types/parts";

interface PartFormFieldsProps {
  form: PartFormData;
  categories: Category[];
  suppliers: Supplier[];
  brands: SettingOption[];
  partQualityTypes: SettingOption[];
  defaultCategoryName?: string;
  defaultSupplierName?: string;
  onChange: (key: keyof PartFormData, value: string) => void;
  onSupplierPriceChange: (index: number, key: "supplierId" | "purchasePriceCny" | "wholesalePriceCny" | "note", value: string) => void;
  onAddSupplierPrice: () => void;
  onRemoveSupplierPrice: (index: number) => void;
}

export function PartFormFields({
  form,
  categories,
  suppliers,
  brands,
  partQualityTypes,
  defaultCategoryName,
  defaultSupplierName,
  onChange,
  onSupplierPriceChange,
  onAddSupplierPrice,
  onRemoveSupplierPrice,
}: PartFormFieldsProps) {
  const typeOptions = partQualityTypes.length
    ? partQualityTypes
    : Object.entries(PART_TYPES).map(([value, label]) => ({ id: value, value, label }));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Part number *"
          value={form.code}
          onChange={(event) => onChange("code", event.target.value)}
          required
          placeholder="Masalan: 51751-47000"
        />
        <Input
          label="Nomi"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Qism nomi"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Kategoriya"
          value={form.categoryId}
          onChange={(event) => onChange("categoryId", event.target.value)}
        >
          <option value="">— Kategoriya tanlanmagan —</option>
          {form.categoryId && !categories.some((category) => category.id === form.categoryId) && (
            <option value={form.categoryId}>
              {defaultCategoryName ?? "Tanlangan kategoriya"}
            </option>
          )}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Select
          label="Quality"
          value={form.type}
          onChange={(event) => onChange("type", event.target.value)}
        >
          {typeOptions.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Brend"
          value={form.brand}
          onChange={(event) => onChange("brand", event.target.value)}
        >
          <option value="">— Brend tanlanmagan —</option>
          {form.brand && !brands.some((brand) => brand.value === form.brand) && (
            <option value={form.brand}>{form.brand}</option>
          )}
          {brands.map((brand) => (
            <option key={brand.id} value={brand.value}>
              {brand.label}
            </option>
          ))}
        </Select>
        <Input
          label="Sotuv narxi (¥)"
          type="number"
          step="0.01"
          value={form.sellingPriceCny}
          onChange={(event) => onChange("sellingPriceCny", event.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">Ta'minotchi narxlari</p>
          <Button type="button" variant="outline" size="sm" onClick={onAddSupplierPrice}>
            Qo'shish
          </Button>
        </div>

        <div className="space-y-3">
          {form.supplierPrices.map((price, index) => (
            <div key={price.id ?? index} className="grid grid-cols-1 gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
              <Select
                label="Ta'minotchi"
                value={price.supplierId}
                onChange={(event) => onSupplierPriceChange(index, "supplierId", event.target.value)}
              >
                <option value="">— Tanlanmagan —</option>
                {price.supplierId && !suppliers.some((supplier) => supplier.id === price.supplierId) && (
                  <option value={price.supplierId}>
                    {defaultSupplierName ?? "Tanlangan ta'minotchi"}
                  </option>
                )}
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </Select>
              <Input
                label="Xarid narxi (¥)"
                type="number"
                step="0.01"
                value={price.purchasePriceCny}
                onChange={(event) => onSupplierPriceChange(index, "purchasePriceCny", event.target.value)}
                placeholder="0.00"
              />
              <Input
                label="Ulgurji narx (¥)"
                type="number"
                step="0.01"
                value={price.wholesalePriceCny}
                onChange={(event) => onSupplierPriceChange(index, "wholesalePriceCny", event.target.value)}
                placeholder="0.00"
              />
              <div className="flex items-end">
                <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => onRemoveSupplierPrice(index)}>
                  O'chirish
                </Button>
              </div>
              <div className="md:col-span-4">
                <Input
                  label="Narx izohi"
                  value={price.note}
                  onChange={(event) => onSupplierPriceChange(index, "note", event.target.value)}
                  placeholder="Masalan: muddat, partiya, shart..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <Textarea
        label="Izoh"
        value={form.note}
        onChange={(event) => onChange("note", event.target.value)}
        rows={2}
        placeholder="Ichki izoh..."
        className="resize-none"
      />
    </>
  );
}

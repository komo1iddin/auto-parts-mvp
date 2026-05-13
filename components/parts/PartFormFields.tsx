import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PART_TYPES } from "@/lib/utils";
import type { Category, PartFormData, Supplier } from "@/components/parts/types";

interface PartFormFieldsProps {
  form: PartFormData;
  categories: Category[];
  suppliers: Supplier[];
  defaultCategoryName?: string;
  defaultSupplierName?: string;
  onChange: (key: keyof PartFormData, value: string) => void;
}

export function PartFormFields({
  form,
  categories,
  suppliers,
  defaultCategoryName,
  defaultSupplierName,
  onChange,
}: PartFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Qism kodi *"
          value={form.code}
          onChange={(event) => onChange("code", event.target.value)}
          required
          placeholder="Masalan: TY-1234-A"
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
          label="Turi"
          value={form.type}
          onChange={(event) => onChange("type", event.target.value)}
        >
          {Object.entries(PART_TYPES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Brend"
          value={form.brand}
          onChange={(event) => onChange("brand", event.target.value)}
          placeholder="Toyota, BMW..."
        />
        <Select
          label="Ta'minotchi"
          value={form.supplierId}
          onChange={(event) => onChange("supplierId", event.target.value)}
        >
          <option value="">— Tanlanmagan —</option>
          {form.supplierId && !suppliers.some((supplier) => supplier.id === form.supplierId) && (
            <option value={form.supplierId}>
              {defaultSupplierName ?? "Tanlangan ta'minotchi"}
            </option>
          )}
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Input
          label="Xarid narxi (¥)"
          type="number"
          step="0.01"
          value={form.purchasePriceCny}
          onChange={(event) => onChange("purchasePriceCny", event.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Ulgurji narx (¥)"
          type="number"
          step="0.01"
          value={form.wholesalePriceCny}
          onChange={(event) => onChange("wholesalePriceCny", event.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Sotuv narxi (¥)"
          type="number"
          step="0.01"
          value={form.sellingPriceCny}
          onChange={(event) => onChange("sellingPriceCny", event.target.value)}
          placeholder="0.00"
        />
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

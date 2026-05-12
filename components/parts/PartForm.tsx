"use client";

import { useState, useEffect } from "react";
import { ImagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PART_TYPES } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
}

interface Supplier {
  id: string;
  name: string;
}

interface PartFormData {
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

interface PartFormProps {
  defaultValues?: Partial<PartFormData> & {
    id?: string;
    categoryName?: string;
    supplierName?: string;
  };
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

function flattenCategories(cats: Category[], prefix = ""): Category[] {
  return cats.flatMap((c) => [
    { ...c, name: prefix + c.name },
    ...flattenCategories(c.children ?? [], prefix + c.name + " → "),
  ]);
}

function buildInitialForm(defaultValues?: PartFormProps["defaultValues"]): PartFormData {
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

export function PartForm({ defaultValues, mode, onSuccess, onCancel, className }: PartFormProps) {
  const router = useRouter();
  const defaultId = defaultValues?.id;
  const defaultCode = defaultValues?.code;
  const defaultName = defaultValues?.name;
  const defaultCategoryId = defaultValues?.categoryId;
  const defaultBrand = defaultValues?.brand;
  const defaultType = defaultValues?.type;
  const defaultPurchasePriceCny = defaultValues?.purchasePriceCny;
  const defaultWholesalePriceCny = defaultValues?.wholesalePriceCny;
  const defaultSellingPriceCny = defaultValues?.sellingPriceCny;
  const defaultSupplierId = defaultValues?.supplierId;
  const defaultNote = defaultValues?.note;
  const defaultImageUrl = defaultValues?.imageUrl;
  const defaultCategoryName = defaultValues?.categoryName;
  const defaultSupplierName = defaultValues?.supplierName;
  const [form, setForm] = useState<PartFormData>(() => buildInitialForm(defaultValues));

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(flattenCategories(d.categories ?? [])));
    fetch("/api/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.suppliers ?? []));
  }, []);

  useEffect(() => {
    setForm(buildInitialForm({
      id: defaultId,
      code: defaultCode,
      name: defaultName,
      categoryId: defaultCategoryId,
      brand: defaultBrand,
      type: defaultType,
      purchasePriceCny: defaultPurchasePriceCny,
      wholesalePriceCny: defaultWholesalePriceCny,
      sellingPriceCny: defaultSellingPriceCny,
      supplierId: defaultSupplierId,
      note: defaultNote,
      imageUrl: defaultImageUrl,
    }));
  }, [
    defaultId,
    defaultCode,
    defaultName,
    defaultCategoryId,
    defaultBrand,
    defaultType,
    defaultPurchasePriceCny,
    defaultWholesalePriceCny,
    defaultSellingPriceCny,
    defaultSupplierId,
    defaultNote,
    defaultImageUrl,
  ]);

  function set(key: keyof PartFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadImage(file: File) {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) set("imageUrl", data.url);
    setUploading(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadImage(file);
    e.target.value = "";
  }

  async function handleImageDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) await uploadImage(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = mode === "edit" ? `/api/parts/${defaultValues?.id}` : "/api/parts";
    const method = mode === "edit" ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        purchasePriceCny: form.purchasePriceCny ? Number(form.purchasePriceCny) : null,
        wholesalePriceCny: form.wholesalePriceCny ? Number(form.wholesalePriceCny) : null,
        sellingPriceCny: form.sellingPriceCny ? Number(form.sellingPriceCny) : null,
        categoryId: form.categoryId || null,
        supplierId: form.supplierId || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      setSaving(false);
      return;
    }

    if (onSuccess) {
      onSuccess();
      return;
    }

    router.push("/admin/parts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={className ?? "space-y-5 max-w-2xl"}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Qism kodi *"
          value={form.code}
          onChange={(e) => set("code", e.target.value)}
          required
          placeholder="Masalan: TY-1234-A"
        />
        <Input
          label="Nomi"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Qism nomi"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Kategoriya"
          value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
        >
            <option value="">— Kategoriya tanlanmagan —</option>
            {form.categoryId && !categories.some((c) => c.id === form.categoryId) && (
              <option value={form.categoryId}>
                {defaultCategoryName ?? "Tanlangan kategoriya"}
              </option>
            )}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </Select>

        <Select
          label="Turi"
          value={form.type}
          onChange={(e) => set("type", e.target.value)}
        >
            {Object.entries(PART_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Brend"
          value={form.brand}
          onChange={(e) => set("brand", e.target.value)}
          placeholder="Toyota, BMW..."
        />
        <Select
          label="Ta'minotchi"
          value={form.supplierId}
          onChange={(e) => set("supplierId", e.target.value)}
        >
            <option value="">— Tanlanmagan —</option>
            {form.supplierId && !suppliers.some((s) => s.id === form.supplierId) && (
              <option value={form.supplierId}>
                {defaultSupplierName ?? "Tanlangan ta'minotchi"}
              </option>
            )}
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Input
          label="Xarid narxi (¥)"
          type="number"
          step="0.01"
          value={form.purchasePriceCny}
          onChange={(e) => set("purchasePriceCny", e.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Ulgurji narx (¥)"
          type="number"
          step="0.01"
          value={form.wholesalePriceCny}
          onChange={(e) => set("wholesalePriceCny", e.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Sotuv narxi (¥)"
          type="number"
          step="0.01"
          value={form.sellingPriceCny}
          onChange={(e) => set("sellingPriceCny", e.target.value)}
          placeholder="0.00"
        />
      </div>

      <Textarea
        label="Izoh"
        value={form.note}
        onChange={(e) => set("note", e.target.value)}
        rows={2}
        placeholder="Ichki izoh..."
        className="resize-none"
      />

      <div className="flex flex-col gap-2">
        <div>
          <span className="text-sm font-medium text-foreground">Rasm</span>
          {form.imageUrl && (
            <p className="mt-1 text-xs text-gray-500">
              Joriy rasm ko'rsatilmoqda. Almashtirish uchun yangi rasm tashlang yoki tanlang.
            </p>
          )}
        </div>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingImage(true);
          }}
          onDragLeave={() => setIsDraggingImage(false)}
          onDrop={handleImageDrop}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed p-3 text-left transition-colors ${
            isDraggingImage
              ? "border-primary bg-primary/5"
              : "border-gray-300 bg-gray-50 hover:bg-gray-100"
          }`}
        >
          {form.imageUrl ? (
            <img src={form.imageUrl} alt="Qism rasmi" className="size-16 shrink-0 rounded-md border bg-white object-cover" />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-white text-gray-500 shadow-xs">
              <ImagePlus className="size-5" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-gray-700">
              {form.imageUrl ? "Joriy rasm bor" : "Rasm yuklash"}
            </span>
            <span className="mt-1 block text-xs text-gray-500">
              Almashtirish uchun rasmni shu yerga tashlang yoki bosing.
            </span>
            <span className="mt-1 block text-xs text-gray-400">PNG, JPG yoki WEBP</span>
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="sr-only"
          />
        </label>
        {uploading && <p className="text-xs text-muted-foreground">Yuklanmoqda...</p>}
      </div>

      {error && (
        <p className="text-destructive text-sm bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saqlanmoqda..." : mode === "edit" ? "Saqlash" : "Qo'shish"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel ?? (() => router.push("/admin/parts"))}
        >
          Bekor qilish
        </Button>
      </div>
    </form>
  );
}

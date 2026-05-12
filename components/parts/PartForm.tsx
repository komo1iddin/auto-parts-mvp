"use client";

import { useState, useEffect } from "react";
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
  defaultValues?: Partial<PartFormData> & { id?: string };
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

export function PartForm({ defaultValues, mode, onSuccess, onCancel, className }: PartFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<PartFormData>({
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
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(flattenCategories(d.categories ?? [])));
    fetch("/api/suppliers").then((r) => r.json()).then((d) => setSuppliers(d.suppliers ?? []));
  }, []);

  function set(key: keyof PartFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) set("imageUrl", data.url);
    setUploading(false);
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
      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Kategoriya"
          value={form.categoryId}
          onChange={(e) => set("categoryId", e.target.value)}
        >
            <option value="">— Kategoriya tanlanmagan —</option>
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

      <div className="grid grid-cols-2 gap-4">
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
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
        <label className="text-sm font-medium text-foreground">Rasm</label>
        {form.imageUrl && (
          <img src={form.imageUrl} alt="Qism rasmi" className="h-24 w-24 object-cover rounded-lg border" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="text-sm text-muted-foreground file:mr-3 file:h-9 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
        />
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

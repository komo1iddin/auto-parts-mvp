"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartFormFields } from "@/components/parts/PartFormFields";
import { PartImageUpload } from "@/components/parts/PartImageUpload";
import {
  buildInitialPartForm,
  flattenCategories,
  toPartPayload,
} from "@/components/parts/partFormUtils";
import type {
  Category,
  PartFormData,
  PartFormDefaultValues,
  Supplier,
} from "@/components/parts/types";
import { Button } from "@/components/ui/Button";

interface PartFormProps {
  defaultValues?: PartFormDefaultValues;
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
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
  const [form, setForm] = useState<PartFormData>(() => buildInitialPartForm(defaultValues));
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => response.json())
      .then((data) => setCategories(flattenCategories(data.categories ?? [])));

    fetch("/api/suppliers")
      .then((response) => response.json())
      .then((data) => setSuppliers(data.suppliers ?? []));
  }, []);

  useEffect(() => {
    setForm(buildInitialPartForm({
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

  function updateField(key: keyof PartFormData, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(file: File) {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (data.url) updateField("imageUrl", data.url);

    setUploading(false);
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await uploadImage(file);
    event.target.value = "";
  }

  async function handleImageDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingImage(false);

    const file = event.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) await uploadImage(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch(mode === "edit" ? `/api/parts/${defaultId}` : "/api/parts", {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPartPayload(form)),
    });

    const data = await response.json();
    if (!response.ok) {
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
      <PartFormFields
        form={form}
        categories={categories}
        suppliers={suppliers}
        defaultCategoryName={defaultCategoryName}
        defaultSupplierName={defaultSupplierName}
        onChange={updateField}
      />

      <PartImageUpload
        imageUrl={form.imageUrl}
        uploading={uploading}
        isDragging={isDraggingImage}
        onDragStateChange={setIsDraggingImage}
        onFileSelect={handleImageUpload}
        onDrop={handleImageDrop}
      />

      {error && (
        <p className="text-destructive rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm">
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

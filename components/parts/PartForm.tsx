"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PartFormFields } from "@/components/parts/form/PartFormFields";
import { PartImageUpload } from "@/components/parts/form/PartImageUpload";
import {
  buildInitialPartForm,
  flattenCategories,
  toPartPayload,
} from "@/components/parts/form/partFormUtils";
import type {
  Category,
  PartFormData,
  PartFormDefaultValues,
  SettingOption,
  Supplier,
} from "@/components/parts/types/parts";
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
  const defaultSellingPriceCny = defaultValues?.sellingPriceCny;
  const defaultSupplierPrices = defaultValues?.supplierPrices;
  const defaultNote = defaultValues?.note;
  const defaultImageUrl = defaultValues?.imageUrl;
  const defaultCategoryName = defaultValues?.categoryName;
  const defaultSupplierName = defaultValues?.supplierName;
  const [form, setForm] = useState<PartFormData>(() => buildInitialPartForm(defaultValues));
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<SettingOption[]>([]);
  const [partQualityTypes, setPartQualityTypes] = useState<SettingOption[]>([]);
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

    fetch("/api/settings/options?kind=brand")
      .then((response) => response.json())
      .then((data) => setBrands(data.options ?? []));

    fetch("/api/settings/options?kind=part_quality_type")
      .then((response) => response.json())
      .then((data) => setPartQualityTypes(data.options ?? []));
  }, []);

  useEffect(() => {
    setForm(buildInitialPartForm({
      id: defaultId,
      code: defaultCode,
      name: defaultName,
      categoryId: defaultCategoryId,
      brand: defaultBrand,
      type: defaultType,
      sellingPriceCny: defaultSellingPriceCny,
      supplierPrices: defaultSupplierPrices,
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
    defaultSellingPriceCny,
    defaultSupplierPrices,
    defaultNote,
    defaultImageUrl,
  ]);

  function updateField(key: keyof PartFormData, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateSupplierPrice(index: number, key: "supplierId" | "purchasePriceCny" | "wholesalePriceCny" | "note", value: string) {
    setForm((current) => ({
      ...current,
      supplierPrices: current.supplierPrices.map((price, priceIndex) => (
        priceIndex === index ? { ...price, [key]: value } : price
      )),
    }));
  }

  function addSupplierPrice() {
    setForm((current) => ({
      ...current,
      supplierPrices: [...current.supplierPrices, { supplierId: "", purchasePriceCny: "", wholesalePriceCny: "", note: "" }],
    }));
  }

  function removeSupplierPrice(index: number) {
    setForm((current) => ({
      ...current,
      supplierPrices: current.supplierPrices.length > 1
        ? current.supplierPrices.filter((_, priceIndex) => priceIndex !== index)
        : [{ supplierId: "", purchasePriceCny: "", wholesalePriceCny: "", note: "" }],
    }));
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
        brands={brands}
        partQualityTypes={partQualityTypes}
        defaultCategoryName={defaultCategoryName}
        defaultSupplierName={defaultSupplierName}
        onChange={updateField}
        onSupplierPriceChange={updateSupplierPrice}
        onAddSupplierPrice={addSupplierPrice}
        onRemoveSupplierPrice={removeSupplierPrice}
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

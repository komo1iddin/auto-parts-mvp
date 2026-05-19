"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImportResolutionModal } from "@/components/orders/builder/ImportResolutionModal";
import type { ImportWarning } from "@/components/orders/builder/ImportResolutionModal";
import { useImportResolution } from "@/components/orders/builder/useImportResolution";
import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";
import { cn } from "@/lib/utils";

type ImportSummary = {
  parsedCount: number;
  createdCount: number;
  existingCount: number;
  createdCodes: string[];
};

interface OrderExcelImportProps {
  onImportItems: (items: OrderItem[]) => void;
  suppliers?: { id: string; name: string }[];
}

export function OrderExcelImport({ onImportItems, suppliers = [] }: OrderExcelImportProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [warnings, setWarnings] = useState<ImportWarning[]>([]);
  const resolution = useImportResolution(suppliers);

  function completeImport(
    data: { items?: OrderItem[]; summary?: ImportSummary; warnings?: ImportWarning[] },
    capturedRowKeys: string[],
  ) {
    const hasOverrides = resolution.bulkSupplierId || Object.keys(resolution.supplierIds).length > 0;
    const items = (data.items ?? []).map((item, idx) =>
      hasOverrides ? resolution.resolveItemSupplier(item, capturedRowKeys[idx]) : item
    );
    onImportItems(items);
    setSummary(data.summary ?? null);
    setWarnings(data.warnings ?? []);
    resolution.reset();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function importFile(file: File) {
    setUploading(true);
    setError("");
    setSummary(null);
    setWarnings([]);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/orders/import", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok) {
      setError(data.error ?? "Excel import qilishda xatolik yuz berdi");
      return;
    }
    if (data.requiresResolution) {
      resolution.open(data);
      setWarnings(data.warnings ?? []);
      return;
    }
    completeImport(data, []);
  }

  async function confirmResolution() {
    const resolutions = resolution.buildResolutions();
    if (!resolutions || !resolution.pending) return;
    if (resolutions.some((r) => !r.type)) {
      setError("Barcha muammoli partlar uchun tur tanlang");
      return;
    }
    setResolving(true);
    setError("");
    const capturedRowKeys = resolution.pending.rows.map((r) => r.rowKey);
    const response = await fetch("/api/orders/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: resolution.pending.rows, resolutions }),
    });
    const data = await response.json().catch(() => ({}));
    setResolving(false);
    if (!response.ok) {
      setError(data.error ?? "Excel import qilishda xatolik yuz berdi");
      return;
    }
    if (data.requiresResolution) {
      resolution.open(data);
      setWarnings(data.warnings ?? []);
      return;
    }
    completeImport(data, capturedRowKeys);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">Excel import</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Part number katalogdan tekshiriladi. Yangi zapchastlar buyurtma saqlanganda katalogga qo'shiladi.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Yuklash
        </Button>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) void importFile(file);
        }}
        disabled={uploading}
        className={cn(
          "flex min-h-24 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-5 text-left transition-colors",
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
          uploading && "cursor-wait opacity-70",
        )}
      >
        <FileSpreadsheet className="size-7 shrink-0 text-emerald-600" />
        <span className="min-w-0">
          <span className="block text-sm font-medium text-gray-800">
            {uploading ? "Excel o'qilmoqda..." : "Excel faylni shu yerga tashlang"}
          </span>
          <span className="mt-0.5 block text-xs text-gray-500">.xlsx, .xls yoki .csv</span>
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) void importFile(file); }}
      />

      {summary && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {summary.parsedCount} qator import qilindi. Katalogda bor: {summary.existingCount}. Yangi qo'shildi:{" "}
          {summary.createdCount} ta saqlashga tayyor.
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {warnings.slice(0, 5).map((w) => (
            <div key={w.rowKey}>
              <div className="font-medium">{w.message}</div>
              <div className="text-amber-800">{w.suggestedAction}</div>
            </div>
          ))}
          {warnings.length > 5 && <div>Yana {warnings.length - 5} ta ogohlantirish bor.</div>}
        </div>
      )}

      {error && !resolution.pending && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <ImportResolutionModal
        pendingResolution={resolution.pending}
        resolving={resolving}
        error={error}
        suppliers={suppliers}
        bulkSupplierId={resolution.bulkSupplierId}
        resolutionTypes={resolution.types}
        resolutionPrices={resolution.prices}
        resolutionSupplierIds={resolution.supplierIds}
        onBulkSupplierChange={resolution.setBulkSupplierId}
        onApplyBulkSupplier={resolution.applyBulkSupplier}
        onTypeChange={resolution.setType}
        onPriceChange={resolution.setPrice}
        onSupplierChange={resolution.setSupplierId}
        onCancel={resolution.reset}
        onConfirm={() => void confirmResolution()}
      />
    </div>
  );
}

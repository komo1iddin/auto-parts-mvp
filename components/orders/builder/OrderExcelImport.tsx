"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";
import { cn } from "@/lib/utils";

type ImportSummary = {
  parsedCount: number;
  createdCount: number;
  existingCount: number;
  createdCodes: string[];
};

type ImportWarning = {
  rowKey: string;
  partCode: string;
  partName: string;
  message: string;
  suggestedAction: string;
};

type ImportRow = {
  rowKey: string;
  partCode: string;
  partName: string;
  purchasePriceCny: number | null;
  quantity: number;
  type: string;
};

type ImportIssue = {
  rowKey: string;
  partCode: string;
  partName: string;
  quantity: number;
  price: number | null;
  purchasePriceCny: number | null;
  sellingPriceCny: number | null;
  existingType: string;
  isNewPart: boolean;
  reason: "missing_type" | "unknown_type";
};

type TypeOption = {
  value: string;
  label: string;
};

type PendingResolution = {
  rows: ImportRow[];
  issues: ImportIssue[];
  typeOptions: TypeOption[];
  warnings?: ImportWarning[];
};

interface OrderExcelImportProps {
  onImportItems: (items: OrderItem[]) => void;
  suppliers?: { id: string; name: string }[];
}

export function OrderExcelImport({ onImportItems, suppliers = [] }: OrderExcelImportProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [warnings, setWarnings] = useState<ImportWarning[]>([]);
  const [pendingResolution, setPendingResolution] = useState<PendingResolution | null>(null);
  const [resolutionTypes, setResolutionTypes] = useState<Record<string, string>>({});
  const [resolutionPrices, setResolutionPrices] = useState<Record<string, { purchasePriceCny: string; sellingPriceCny: string }>>({});
  const [resolutionSupplierIds, setResolutionSupplierIds] = useState<Record<string, string>>({});
  const [bulkSupplierId, setBulkSupplierId] = useState("");

  function resetResolution() {
    setPendingResolution(null);
    setResolutionTypes({});
    setResolutionPrices({});
    setResolutionSupplierIds({});
    setBulkSupplierId("");
  }

  function completeImport(data: { items?: OrderItem[]; summary?: ImportSummary; warnings?: ImportWarning[] }, capturedResolution: PendingResolution | null) {
    let items = data.items ?? [];

    if (Object.keys(resolutionSupplierIds).length > 0 || bulkSupplierId) {
      items = items.map((item, index) => {
        const rowKey = capturedResolution?.rows[index]?.rowKey;
        const perRowId = rowKey ? resolutionSupplierIds[rowKey] : undefined;
        const supplierId = perRowId || item.supplierId || bulkSupplierId || "";
        if (!supplierId || supplierId === item.supplierId) return item;
        const supplier = suppliers.find((s) => s.id === supplierId);
        return { ...item, supplierId, supplierName: supplier?.name ?? item.supplierName };
      });
    }

    onImportItems(items);
    setSummary(data.summary ?? null);
    setWarnings(data.warnings ?? []);
    resetResolution();
    if (inputRef.current) inputRef.current.value = "";
  }

  function openResolution(data: PendingResolution) {
    setPendingResolution(data);
    setWarnings(data.warnings ?? []);
    setResolutionTypes((current) => {
      const next: Record<string, string> = {};
      for (const issue of data.issues) {
        const previous = current[issue.rowKey];
        const existing = data.typeOptions.some((option) => option.value === issue.existingType)
          ? issue.existingType
          : "";
        next[issue.rowKey] = previous || existing;
      }
      return next;
    });
    setResolutionPrices((current) => {
      const next: Record<string, { purchasePriceCny: string; sellingPriceCny: string }> = {};
      for (const issue of data.issues) {
        const previous = current[issue.rowKey];
        next[issue.rowKey] = previous ?? {
          purchasePriceCny: issue.purchasePriceCny == null ? "" : String(issue.purchasePriceCny),
          sellingPriceCny: issue.sellingPriceCny == null ? "" : String(issue.sellingPriceCny),
        };
      }
      return next;
    });
    setResolutionSupplierIds((current) => {
      const next: Record<string, string> = {};
      for (const issue of data.issues) {
        next[issue.rowKey] = current[issue.rowKey] ?? "";
      }
      return next;
    });
  }

  function applyBulkSupplier() {
    if (!bulkSupplierId || !pendingResolution) return;
    setResolutionSupplierIds(() => {
      const next: Record<string, string> = {};
      for (const issue of pendingResolution.issues) {
        next[issue.rowKey] = bulkSupplierId;
      }
      return next;
    });
  }

  function numberOrNull(value: string) {
    if (value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function importFile(file: File) {
    setUploading(true);
    setError("");
    setSummary(null);
    setWarnings([]);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/orders/import", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    setUploading(false);
    if (!response.ok) {
      setError(data.error ?? "Excel import qilishda xatolik yuz berdi");
      return;
    }

    if (data.requiresResolution) {
      openResolution(data);
      return;
    }

    completeImport(data, null);
  }

  async function confirmResolution() {
    if (!pendingResolution) return;
    const resolutions = pendingResolution.issues.map((issue) => ({
      rowKey: issue.rowKey,
      partCode: issue.partCode,
      type: resolutionTypes[issue.rowKey] ?? "",
      purchasePriceCny: numberOrNull(resolutionPrices[issue.rowKey]?.purchasePriceCny ?? ""),
      sellingPriceCny: numberOrNull(resolutionPrices[issue.rowKey]?.sellingPriceCny ?? ""),
    }));
    const missing = resolutions.some((resolution) => !resolution.type);
    if (missing) {
      setError("Barcha muammoli partlar uchun tur tanlang");
      return;
    }

    setResolving(true);
    setError("");

    const captured = pendingResolution;
    const response = await fetch("/api/orders/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: pendingResolution.rows,
        resolutions,
      }),
    });
    const data = await response.json().catch(() => ({}));

    setResolving(false);
    if (!response.ok) {
      setError(data.error ?? "Excel import qilishda xatolik yuz berdi");
      return;
    }
    if (data.requiresResolution) {
      openResolution(data);
      return;
    }

    completeImport(data, captured);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    void importFile(file);
  }

  function updateResolutionPrice(rowKey: string, field: "purchasePriceCny" | "sellingPriceCny", value: string) {
    setResolutionPrices((current) => ({
      ...current,
      [rowKey]: {
        purchasePriceCny: current[rowKey]?.purchasePriceCny ?? "",
        sellingPriceCny: current[rowKey]?.sellingPriceCny ?? "",
        [field]: value,
      },
    }));
  }

  const supplierOptions = [
    { value: "", label: "—" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">Excel import</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Part number katalogdan tekshiriladi. Yangi zapchastlar buyurtma saqlanganda katalogga qo'shiladi.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Yuklash
        </Button>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        disabled={uploading}
        className={cn(
          "flex min-h-24 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-5 text-left transition-colors",
          dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
          uploading && "cursor-wait opacity-70"
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
        onChange={(event) => handleFiles(event.target.files)}
      />

      {summary && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {summary.parsedCount} qator import qilindi. Katalogda bor: {summary.existingCount}. Yangi qo'shildi:{" "}
          {summary.createdCount} ta saqlashga tayyor.
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {warnings.slice(0, 5).map((warning) => (
            <div key={warning.rowKey}>
              <div className="font-medium">{warning.message}</div>
              <div className="text-amber-800">{warning.suggestedAction}</div>
            </div>
          ))}
          {warnings.length > 5 && <div>Yana {warnings.length - 5} ta ogohlantirish bor.</div>}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <Modal
        open={Boolean(pendingResolution)}
        onClose={() => {
          if (!resolving) resetResolution();
        }}
        title="Part turini aniqlash"
        className="max-w-6xl"
      >
        {pendingResolution && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Quyidagi part numberlar uchun tur/sifat aniq emas. Catalogga qo'shish yoki orderga bog'lashdan oldin turini belgilang.
            </p>

            {suppliers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm font-medium text-gray-700">Barchasi uchun ta'minotchi:</span>
                <select
                  value={bulkSupplierId}
                  onChange={(event) => setBulkSupplierId(event.target.value)}
                  disabled={resolving}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                >
                  <option value="">Tanlang</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={resolving || !bulkSupplierId}
                  onClick={applyBulkSupplier}
                >
                  Barchasiga belgilash
                </Button>
              </div>
            )}

            <div className="max-h-[55vh] overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Part number</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Miqdor</th>
                    <th className="w-24 px-2 py-2 text-center text-xs font-semibold text-gray-600">Sotib olish</th>
                    <th className="w-24 px-2 py-2 text-center text-xs font-semibold text-gray-600">Sotish</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Katalogda mavjudmi?</th>
                    <th className="w-40 px-3 py-2 text-center text-xs font-semibold text-gray-600">Turi</th>
                    {suppliers.length > 0 && (
                      <th className="w-36 px-3 py-2 text-left text-xs font-semibold text-gray-600">Ta'minotchi</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pendingResolution.issues.map((issue) => (
                    <tr key={issue.rowKey} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2 font-mono text-xs font-semibold text-gray-800">{issue.partCode}</td>
                      <td className="px-3 py-2 text-center text-gray-700">{issue.quantity}</td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={resolutionPrices[issue.rowKey]?.purchasePriceCny ?? ""}
                          onChange={(event) => updateResolutionPrice(issue.rowKey, "purchasePriceCny", event.target.value)}
                          disabled={resolving}
                          className="mx-auto h-8 w-20 px-2 text-center"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={resolutionPrices[issue.rowKey]?.sellingPriceCny ?? ""}
                          onChange={(event) => updateResolutionPrice(issue.rowKey, "sellingPriceCny", event.target.value)}
                          disabled={resolving}
                          className="mx-auto h-8 w-20 px-2 text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {issue.isNewPart ? (
                          <span className="text-gray-400">Yo'q</span>
                        ) : (
                          <span className="text-emerald-700">
                            Bor{issue.existingType ? ` (${issue.existingType})` : ""}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Select
                          value={resolutionTypes[issue.rowKey] ?? ""}
                          onChange={(event) => setResolutionTypes((current) => ({
                            ...current,
                            [issue.rowKey]: event.target.value,
                          }))}
                          disabled={resolving}
                        >
                          <option value="">Tanlang</option>
                          {pendingResolution.typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </td>
                      {suppliers.length > 0 && (
                        <td className="px-3 py-2">
                          <Select
                            value={resolutionSupplierIds[issue.rowKey] ?? ""}
                            onChange={(event) => setResolutionSupplierIds((current) => ({
                              ...current,
                              [issue.rowKey]: event.target.value,
                            }))}
                            disabled={resolving}
                          >
                            {supplierOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </Select>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={resolving}
                onClick={resetResolution}
              >
                Bekor qilish
              </Button>
              <Button
                type="button"
                disabled={resolving || pendingResolution.issues.some((issue) => !resolutionTypes[issue.rowKey])}
                onClick={() => void confirmResolution()}
              >
                {resolving ? "Saqlanmoqda..." : "Tasdiqlash"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

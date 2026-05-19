"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

export type ImportWarning = {
  rowKey: string;
  partCode: string;
  partName: string;
  message: string;
  suggestedAction: string;
};

export type ImportRow = {
  rowKey: string;
  partCode: string;
  partName: string;
  purchasePriceCny: number | null;
  quantity: number;
  type: string;
};

export type ImportIssue = {
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

export type TypeOption = {
  value: string;
  label: string;
};

export type PendingResolution = {
  rows: ImportRow[];
  issues: ImportIssue[];
  typeOptions: TypeOption[];
  warnings?: ImportWarning[];
};

interface ImportResolutionModalProps {
  pendingResolution: PendingResolution | null;
  resolving: boolean;
  error: string;
  suppliers: { id: string; name: string }[];
  bulkSupplierId: string;
  resolutionTypes: Record<string, string>;
  resolutionPrices: Record<string, { purchasePriceCny: string; sellingPriceCny: string }>;
  resolutionSupplierIds: Record<string, string>;
  onBulkSupplierChange: (id: string) => void;
  onApplyBulkSupplier: () => void;
  onTypeChange: (rowKey: string, type: string) => void;
  onPriceChange: (rowKey: string, field: "purchasePriceCny" | "sellingPriceCny", value: string) => void;
  onSupplierChange: (rowKey: string, supplierId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ImportResolutionModal({
  pendingResolution,
  resolving,
  error,
  suppliers,
  bulkSupplierId,
  resolutionTypes,
  resolutionPrices,
  resolutionSupplierIds,
  onBulkSupplierChange,
  onApplyBulkSupplier,
  onTypeChange,
  onPriceChange,
  onSupplierChange,
  onCancel,
  onConfirm,
}: ImportResolutionModalProps) {
  const supplierOptions = [
    { value: "", label: "—" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <Modal
      open={Boolean(pendingResolution)}
      onClose={() => { if (!resolving) onCancel(); }}
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
                onChange={(event) => onBulkSupplierChange(event.target.value)}
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
                onClick={onApplyBulkSupplier}
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
                        onChange={(event) => onPriceChange(issue.rowKey, "purchasePriceCny", event.target.value)}
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
                        onChange={(event) => onPriceChange(issue.rowKey, "sellingPriceCny", event.target.value)}
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
                        onChange={(event) => onTypeChange(issue.rowKey, event.target.value)}
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
                          onChange={(event) => onSupplierChange(issue.rowKey, event.target.value)}
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" disabled={resolving} onClick={onCancel}>
              Bekor qilish
            </Button>
            <Button
              type="button"
              disabled={resolving || pendingResolution.issues.some((issue) => !resolutionTypes[issue.rowKey])}
              onClick={onConfirm}
            >
              {resolving ? "Saqlanmoqda..." : "Tasdiqlash"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

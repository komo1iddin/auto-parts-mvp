"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ImportResolutionBulkSupplier } from "./ImportResolutionBulkSupplier";
import { ImportResolutionTable } from "./ImportResolutionTable";
import type { PendingResolution, SupplierOption } from "../types";

interface ImportResolutionModalProps {
  pendingResolution: PendingResolution | null;
  resolving: boolean;
  error: string;
  suppliers: SupplierOption[];
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

          <ImportResolutionBulkSupplier
            suppliers={suppliers}
            bulkSupplierId={bulkSupplierId}
            resolving={resolving}
            onBulkSupplierChange={onBulkSupplierChange}
            onApplyBulkSupplier={onApplyBulkSupplier}
          />

          <ImportResolutionTable
            pendingResolution={pendingResolution}
            resolving={resolving}
            suppliers={suppliers}
            resolutionTypes={resolutionTypes}
            resolutionPrices={resolutionPrices}
            resolutionSupplierIds={resolutionSupplierIds}
            onTypeChange={onTypeChange}
            onPriceChange={onPriceChange}
            onSupplierChange={onSupplierChange}
          />

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

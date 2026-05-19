"use client";

import { Button } from "@/components/ui/Button";
import type { SupplierOption } from "../types";

interface ImportResolutionBulkSupplierProps {
  suppliers: SupplierOption[];
  bulkSupplierId: string;
  resolving: boolean;
  onBulkSupplierChange: (id: string) => void;
  onApplyBulkSupplier: () => void;
}

export function ImportResolutionBulkSupplier({
  suppliers,
  bulkSupplierId,
  resolving,
  onBulkSupplierChange,
  onApplyBulkSupplier,
}: ImportResolutionBulkSupplierProps) {
  if (!suppliers.length) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-sm font-medium text-gray-700">Barchasi uchun ta'minotchi:</span>
      <select
        value={bulkSupplierId}
        onChange={(event) => onBulkSupplierChange(event.target.value)}
        disabled={resolving}
        className="h-8 rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
      >
        <option value="">Tanlang</option>
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
        ))}
      </select>
      <Button type="button" variant="outline" size="sm" disabled={resolving || !bulkSupplierId} onClick={onApplyBulkSupplier}>
        Barchasiga belgilash
      </Button>
    </div>
  );
}

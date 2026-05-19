"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { PendingResolution, SupplierOption } from "../types";

interface ImportResolutionTableProps {
  pendingResolution: PendingResolution;
  resolving: boolean;
  suppliers: SupplierOption[];
  resolutionTypes: Record<string, string>;
  resolutionPrices: Record<string, { purchasePriceCny: string; sellingPriceCny: string }>;
  resolutionSupplierIds: Record<string, string>;
  onTypeChange: (rowKey: string, type: string) => void;
  onPriceChange: (rowKey: string, field: "purchasePriceCny" | "sellingPriceCny", value: string) => void;
  onSupplierChange: (rowKey: string, supplierId: string) => void;
}

export function ImportResolutionTable({
  pendingResolution,
  resolving,
  suppliers,
  resolutionTypes,
  resolutionPrices,
  resolutionSupplierIds,
  onTypeChange,
  onPriceChange,
  onSupplierChange,
}: ImportResolutionTableProps) {
  const supplierOptions = [
    { value: "", label: "—" },
    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
  ];

  return (
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
                    <option key={option.value} value={option.value}>{option.label}</option>
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
                    {supplierOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

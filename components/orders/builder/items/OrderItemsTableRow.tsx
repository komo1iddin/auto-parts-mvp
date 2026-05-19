"use client";

import { X } from "lucide-react";
import { TableInput, TableSelect } from "@/components/orders/builder/items/OrderTableControls";
import type { OrderItem, Supplier } from "@/components/orders/types/orderBuilderTypes";
import { cn } from "@/lib/utils";

interface OrderItemsTableRowProps {
  item: OrderItem;
  rowNumber: number;
  isAdmin: boolean;
  duplicate: boolean;
  typeOptions: { value: string; label: string }[];
  supplierOptions: { value: string; label: string }[];
  suppliers: Supplier[];
  updateField: <K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) => void;
  updateQty: (partId: string, qty: number) => void;
  onDelete: (item: OrderItem) => void;
}

export function OrderItemsTableRow({
  item,
  rowNumber,
  isAdmin,
  duplicate,
  typeOptions,
  supplierOptions,
  suppliers,
  updateField,
  updateQty,
  onDelete,
}: OrderItemsTableRowProps) {
  const rowKey = item.id ?? item.partVariantId ?? item.partId ?? item.localId ?? item.partCode;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50">
      <td className="px-4 py-2.5 text-center align-middle text-xs font-semibold text-gray-400 tabular-nums">
        {rowNumber}
      </td>

      <td className="px-4 py-2.5 align-middle whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-800">{item.partCode}</span>
          {duplicate && (
            <span
              title="Bu kod buyurtmada bir necha marta mavjud"
              className="shrink-0 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700"
            >
              2×
            </span>
          )}
        </div>
      </td>

      <td className="max-w-[140px] truncate px-4 py-2.5 text-center align-middle text-sm text-gray-600">
        {item.partName || "—"}
      </td>

      <td className="px-4 py-2 align-middle">
        <div className="flex justify-center">
          <TableSelect
            value={item.type}
            onChange={(value) => updateField(rowKey, "type", value)}
            options={typeOptions}
            width={112}
            menuWidth={128}
          />
        </div>
      </td>

      {isAdmin && (
        <td className="px-4 py-2 align-middle">
          <div className="flex justify-center">
            <TableInput
              value={item.purchasePriceCny ?? ""}
              onChange={(value) => updateField(rowKey, "purchasePriceCny", value === "" ? null : Number(value))}
              width={80}
              placeholder="0"
            />
          </div>
        </td>
      )}

      <td className="px-4 py-2 align-middle">
        <div className="flex justify-center">
          <TableInput
            value={item.sellingPriceCny ?? ""}
            onChange={(value) => updateField(rowKey, "sellingPriceCny", value === "" ? null : Number(value))}
            width={80}
            placeholder="0"
          />
        </div>
      </td>

      <td className="px-4 py-2 align-middle">
        <div className="flex justify-center">
          <TableInput
            value={item.quantity}
            onChange={(value) => updateQty(rowKey, value === "" ? 0 : Number(value))}
            width={64}
            step={1}
          />
        </div>
      </td>

      {isAdmin && (
        <td className="px-4 py-2 align-middle">
          <div className="flex justify-center">
            <TableSelect
              value={item.supplierId}
              onChange={(value) => {
                const supplier = suppliers.find((entry) => entry.id === value);
                updateField(rowKey, "supplierId", value);
                updateField(rowKey, "supplierName", supplier?.name ?? "");
              }}
              options={supplierOptions}
              width={128}
            />
          </div>
        </td>
      )}

      <td className="px-4 py-2 align-middle">
        <div className="flex justify-center">
          <input
            type="text"
            value={item.note}
            onChange={(event) => updateField(rowKey, "note", event.target.value)}
            placeholder="Izoh..."
            className={cn(
              "flex h-8 rounded-md border border-input bg-background px-2 py-0 text-sm shadow-xs transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
            )}
            style={{ width: 96 }}
          />
        </div>
      </td>

      <td className="px-3 py-2 align-middle">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="size-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

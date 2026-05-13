"use client";

import { X } from "lucide-react";
import { TableInput, TableSelect } from "@/components/orders/builder/OrderTableControls";
import type { OrderItem, Supplier } from "@/components/orders/types/orderBuilderTypes";
import { cn, PART_TYPES } from "@/lib/utils";

interface Props {
  items: OrderItem[];
  isAdmin: boolean;
  suppliers: Supplier[];
  duplicateCodes: Set<string>;
  updateField: <K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) => void;
  updateQty: (partId: string, qty: number) => void;
  onDelete: (item: OrderItem) => void;
}

export function OrderItemsTable({ items, isAdmin, suppliers, duplicateCodes, updateField, updateQty, onDelete }: Props) {
  const typeOptions = Object.entries(PART_TYPES).map(([k, v]) => ({ value: k, label: v }));
  const supplierOptions = [
    { value: "", label: "—" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Buyurtma qismlari</h2>
        <span className="text-sm text-gray-500">{items.length} ta qism</span>
      </div>

      {items.length === 0 ? (
        <p className="p-12 text-center text-gray-400">Hali qism qo'shilmagan</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Kod</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Nomi</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Turi</th>
                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Xarid (¥)</th>}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Sotuv (¥)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Miqdor</th>
                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Ta'minotchi</th>}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Izoh</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 w-16">Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.partId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  {/* Kod */}
                  <td className="px-4 py-2.5 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-800">{item.partCode}</span>
                      {duplicateCodes.has(item.partCode) && (
                        <span
                          title="Bu kod buyurtmada bir necha marta mavjud"
                          className="shrink-0 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700"
                        >
                          2×
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Nomi */}
                  <td className="px-4 py-2.5 text-center align-middle text-gray-600 text-sm max-w-[140px] truncate">{item.partName || "—"}</td>

                  {/* Turi */}
                  <td className="px-4 py-2 align-middle">
                    <div className="flex justify-center">
                      <TableSelect
                        value={item.type}
                        onChange={(v) => updateField(item.partId, "type", v)}
                        options={typeOptions}
                        width={112}
                      />
                    </div>
                  </td>

                  {/* Xarid */}
                  {isAdmin && (
                    <td className="px-4 py-2 align-middle">
                      <div className="flex justify-center">
                        <TableInput
                          value={item.purchasePriceCny ?? ""}
                          onChange={(v) => updateField(item.partId, "purchasePriceCny", v === "" ? null : Number(v))}
                          width={80}
                          placeholder="0"
                        />
                      </div>
                    </td>
                  )}

                  {/* Sotuv */}
                  <td className="px-4 py-2 align-middle">
                    <div className="flex justify-center">
                      <TableInput
                        value={item.sellingPriceCny ?? ""}
                        onChange={(v) => updateField(item.partId, "sellingPriceCny", v === "" ? null : Number(v))}
                        width={80}
                        placeholder="0"
                      />
                    </div>
                  </td>

                  {/* Miqdor */}
                  <td className="px-4 py-2 align-middle">
                    <div className="flex justify-center">
                      <TableInput
                        value={item.quantity}
                        onChange={(v) => updateQty(item.partId, v === "" ? 0 : Number(v))}
                        width={64}
                        center
                        step={1}
                      />
                    </div>
                  </td>

                  {/* Ta'minotchi */}
                  {isAdmin && (
                    <td className="px-4 py-2 align-middle">
                      <div className="flex justify-center">
                        <TableSelect
                          value={item.supplierId}
                          onChange={(v) => {
                            const sup = suppliers.find((s) => s.id === v);
                            updateField(item.partId, "supplierId", v);
                            updateField(item.partId, "supplierName", sup?.name ?? "");
                          }}
                          options={supplierOptions}
                          width={128}
                        />
                      </div>
                    </td>
                  )}

                  {/* Izoh */}
                  <td className="px-4 py-2 align-middle">
                    <div className="flex justify-center">
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => updateField(item.partId, "note", e.target.value)}
                        placeholder="Izoh..."
                        className={cn(
                          "flex h-8 rounded-md border border-input bg-background px-2 py-0 text-sm shadow-xs transition-colors outline-none",
                          "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                        )}
                        style={{ width: 96 }}
                      />
                    </div>
                  </td>

                  {/* Delete */}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

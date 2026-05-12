"use client";

import { ChevronDown, X } from "lucide-react";
import { cn, PART_TYPES } from "@/lib/utils";

interface OrderItem {
  partId: string;
  partCode: string;
  partName: string;
  categoryName: string;
  brand: string;
  type: string;
  sellingPriceCny: number | null;
  purchasePriceCny: number | null;
  wholesalePriceCny: number | null;
  supplierId: string;
  supplierName: string;
  quantity: number;
  note: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface Props {
  items: OrderItem[];
  isAdmin: boolean;
  suppliers: Supplier[];
  duplicateCodes: Set<string>;
  updateField: <K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) => void;
  updateQty: (partId: string, qty: number) => void;
  onDelete: (item: OrderItem) => void;
}

function TableSelect({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width: number;
}) {
  return (
    <div className="relative" style={{ width }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-7 w-full appearance-none rounded-md border border-input bg-background px-2 py-0 pr-6 text-xs shadow-xs transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function TableInput({
  value,
  onChange,
  width,
  center,
  placeholder,
}: {
  value: string | number;
  onChange: (v: string) => void;
  width: number;
  center?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "0"}
      className={cn(
        "flex h-7 rounded-md border border-input bg-background px-2 py-0 text-xs shadow-xs transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50",
        center && "text-center"
      )}
      style={{ width }}
    />
  );
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Nomi</th>
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
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm text-gray-800">{item.partCode}</span>
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
                  <td className="px-4 py-2.5 text-gray-600 text-sm max-w-[140px] truncate">{item.partName || "—"}</td>

                  {/* Turi */}
                  <td className="px-4 py-2">
                    <div className="flex justify-center">
                      <TableSelect
                        value={item.type}
                        onChange={(v) => updateField(item.partId, "type", v)}
                        options={typeOptions}
                        width={96}
                      />
                    </div>
                  </td>

                  {/* Xarid */}
                  {isAdmin && (
                    <td className="px-4 py-2">
                      <div className="flex justify-center">
                        <TableInput
                          value={item.purchasePriceCny ?? ""}
                          onChange={(v) => updateField(item.partId, "purchasePriceCny", v === "" ? null : Number(v))}
                          width={72}
                          placeholder="0"
                        />
                      </div>
                    </td>
                  )}

                  {/* Sotuv */}
                  <td className="px-4 py-2">
                    <div className="flex justify-center">
                      <TableInput
                        value={item.sellingPriceCny ?? ""}
                        onChange={(v) => updateField(item.partId, "sellingPriceCny", v === "" ? null : Number(v))}
                        width={72}
                        placeholder="0"
                      />
                    </div>
                  </td>

                  {/* Miqdor */}
                  <td className="px-4 py-2">
                    <div className="flex justify-center">
                      <TableInput
                        value={item.quantity}
                        onChange={(v) => updateQty(item.partId, Number(v))}
                        width={56}
                        center
                      />
                    </div>
                  </td>

                  {/* Ta'minotchi */}
                  {isAdmin && (
                    <td className="px-4 py-2">
                      <div className="flex justify-center">
                        <TableSelect
                          value={item.supplierId}
                          onChange={(v) => {
                            const sup = suppliers.find((s) => s.id === v);
                            updateField(item.partId, "supplierId", v);
                            updateField(item.partId, "supplierName", sup?.name ?? "");
                          }}
                          options={supplierOptions}
                          width={96}
                        />
                      </div>
                    </td>
                  )}

                  {/* Izoh */}
                  <td className="px-4 py-2">
                    <div className="flex justify-center">
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => updateField(item.partId, "note", e.target.value)}
                        placeholder="Izoh..."
                        className={cn(
                          "flex h-7 rounded-md border border-input bg-background px-2 py-0 text-xs shadow-xs transition-colors outline-none",
                          "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                        )}
                        style={{ width: 96 }}
                      />
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="px-3 py-2">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className="inline-flex items-center justify-center size-7 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

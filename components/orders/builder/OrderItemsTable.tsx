"use client";

import { OrderItemsTableRow } from "@/components/orders/builder/OrderItemsTableRow";
import type { OrderItem, Supplier } from "@/components/orders/types/orderBuilderTypes";
import { PART_TYPES } from "@/lib/utils";

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
  const typeOptions = Object.entries(PART_TYPES).map(([key, label]) => ({ value: key, label }));
  const supplierOptions = [
    { value: "", label: "—" },
    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-800">Buyurtma qismlari</h2>
        <span className="text-sm text-gray-500">{items.length} ta qism</span>
      </div>

      {items.length === 0 ? (
        <p className="p-12 text-center text-gray-400">Hali qism qo'shilmagan</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap">Kod</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Nomi</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Turi</th>
                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Xarid (¥)</th>}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Sotuv (¥)</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Miqdor</th>
                {isAdmin && <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">Ta'minotchi</th>}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Izoh</th>
                <th className="w-16 px-4 py-3 text-center text-xs font-semibold text-gray-600">Amal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <OrderItemsTableRow
                  key={item.partId}
                  item={item}
                  isAdmin={isAdmin}
                  duplicate={duplicateCodes.has(item.partCode)}
                  typeOptions={typeOptions}
                  supplierOptions={supplierOptions}
                  suppliers={suppliers}
                  updateField={updateField}
                  updateQty={updateQty}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

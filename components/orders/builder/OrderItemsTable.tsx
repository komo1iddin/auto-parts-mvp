"use client";

import { OrderItemsTableRow } from "@/components/orders/builder/OrderItemsTableRow";
import { TableSelect } from "@/components/orders/builder/OrderTableControls";
import type { OrderItem, SettingOption, Supplier } from "@/components/orders/types/orderBuilderTypes";
import { PART_TYPES } from "@/lib/utils";

interface Props {
  items: OrderItem[];
  isAdmin: boolean;
  suppliers: Supplier[];
  partQualityTypes: SettingOption[];
  duplicateCodes: Set<string>;
  updateField: <K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) => void;
  updateQty: (partId: string, qty: number) => void;
  updateAllSuppliers: (supplierId: string, supplierName: string) => void;
  onDelete: (item: OrderItem) => void;
}

const BULK_SUPPLIER_PLACEHOLDER = "__bulk_supplier_placeholder";

export function OrderItemsTable({
  items,
  isAdmin,
  suppliers,
  partQualityTypes,
  duplicateCodes,
  updateField,
  updateQty,
  updateAllSuppliers,
  onDelete,
}: Props) {
  const baseTypeOptions = partQualityTypes.length
    ? partQualityTypes.map((option) => ({ value: option.value, label: option.label }))
    : Object.entries(PART_TYPES).map(([key, label]) => ({ value: key, label }));
  const unknownTypeOptions = Array.from(
    new Set(
      items
        .map((item) => item.type)
        .filter((type) => type && !baseTypeOptions.some((option) => option.value === type))
    )
  ).map((type) => ({ value: type, label: type }));
  const typeOptions = [{ value: "", label: "—" }, ...baseTypeOptions, ...unknownTypeOptions];
  const supplierOptions = [
    { value: "", label: "—" },
    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
  ];
  const bulkSupplierOptions = [
    { value: BULK_SUPPLIER_PLACEHOLDER, label: "Hammasiga" },
    { value: "", label: "— Tozalash" },
    ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
  ];

  function applySupplierToAll(supplierId: string) {
    if (supplierId === BULK_SUPPLIER_PLACEHOLDER) return;
    const supplier = suppliers.find((entry) => entry.id === supplierId);
    updateAllSuppliers(supplierId, supplier?.name ?? "");
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-800">Buyurtma qismlari</h2>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && items.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Ta'minotchi:</span>
              <TableSelect
                value={BULK_SUPPLIER_PLACEHOLDER}
                onChange={applySupplierToAll}
                options={bulkSupplierOptions}
                width={132}
                menuWidth={156}
              />
            </div>
          )}
          <span className="text-sm text-gray-500">{items.length} ta qism</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="p-12 text-center text-gray-400">Hali qism qo'shilmagan</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="w-12 px-4 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">№</th>
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
              {items.map((item, index) => (
                <OrderItemsTableRow
                  key={item.id ?? item.localId ?? `${item.partVariantId || item.partId || item.partCode}-${item.type}-${index}`}
                  item={item}
                  rowNumber={index + 1}
                  isAdmin={isAdmin}
                  duplicate={duplicateCodes.has(`${item.partCode.trim().toLowerCase()}::${item.type}`)}
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

"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Customer } from "@/components/orders/types/orderBuilderTypes";
import { ORDER_EDIT_STATUS_OPTIONS } from "@/lib/utils";

interface OrderBuilderOptionsProps {
  customers: Customer[];
  customerId: string;
  status: string;
  changeNote: string;
  changelogPreview: string;
  isEdit: boolean;
  onCustomerChange: (customerId: string) => void;
  onStatusChange: (status: string) => void;
  onChangeNoteChange: (note: string) => void;
}

export function OrderBuilderOptions({
  customers,
  customerId,
  status,
  changeNote,
  changelogPreview,
  isEdit,
  onCustomerChange,
  onStatusChange,
  onChangeNoteChange,
}: OrderBuilderOptionsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full max-w-sm sm:w-80">
          <Select
            label="Mijoz *"
            value={customerId}
            onChange={(event) => onCustomerChange(event.target.value)}
            className={!customerId ? "text-gray-400" : undefined}
          >
            <option value="">Mijoz tanlang</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full max-w-xs sm:w-72">
          <Select
            label="Holat"
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            {ORDER_EDIT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {isEdit && (
        <div className="max-w-sm space-y-1">
          <Input
            label="O'zgartirish izohi"
            type="text"
            value={changeNote}
            onChange={(event) => onChangeNoteChange(event.target.value)}
            placeholder="Bo'sh qoldirsangiz, avtomatik to'ldiriladi"
          />
          <p className="text-xs text-gray-400">Avtomat: {changelogPreview}</p>
        </div>
      )}
    </div>
  );
}

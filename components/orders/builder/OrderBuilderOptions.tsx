"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ORDER_EDIT_STATUS_OPTIONS } from "@/lib/utils";

interface OrderBuilderOptionsProps {
  status: string;
  changeNote: string;
  changelogPreview: string;
  isEdit: boolean;
  onStatusChange: (status: string) => void;
  onChangeNoteChange: (note: string) => void;
}

export function OrderBuilderOptions({
  status,
  changeNote,
  changelogPreview,
  isEdit,
  onStatusChange,
  onChangeNoteChange,
}: OrderBuilderOptionsProps) {
  return (
    <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
      <div className="w-full max-w-xs">
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

      {isEdit && (
        <div className="space-y-1">
          <Input
            label="O'zgartirish izohi"
            type="text"
            value={changeNote}
            onChange={(event) => onChangeNoteChange(event.target.value)}
            placeholder="Bo'sh qoldirsangiz, avtomatik to'ldiriladi"
            className="max-w-sm"
          />
          <p className="text-xs text-gray-400">Avtomat: {changelogPreview}</p>
        </div>
      )}
    </div>
  );
}

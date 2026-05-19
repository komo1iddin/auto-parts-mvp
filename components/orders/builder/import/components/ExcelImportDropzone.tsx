"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExcelImportDropzoneProps {
  uploading: boolean;
  disabled: boolean;
  onPickFile: () => void;
  onFile: (file: File) => void;
}

export function ExcelImportDropzone({ uploading, disabled, onPickFile, onFile }: ExcelImportDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <button
      type="button"
      onClick={onPickFile}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      disabled={disabled}
      className={cn(
        "flex min-h-32 w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed px-4 py-5 text-left transition-colors",
        dragging ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100",
        disabled && "cursor-wait opacity-70",
      )}
    >
      <FileSpreadsheet className="size-7 shrink-0 text-emerald-600" />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-800">
          {uploading ? "Excel o'qilmoqda..." : "Excel faylni shu yerga tashlang"}
        </span>
        <span className="mt-0.5 block text-xs text-gray-500">.xlsx, .xls yoki .csv</span>
      </span>
    </button>
  );
}

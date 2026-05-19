"use client";

import { ClipboardPaste, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

interface ClipboardImportBoxProps {
  value: string;
  importing: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onReadClipboard: () => void;
  onParse: () => void;
}

export function ClipboardImportBox({
  value,
  importing,
  disabled,
  onChange,
  onReadClipboard,
  onParse,
}: ClipboardImportBoxProps) {
  const importIcon = importing ? <Loader2 className="size-4 animate-spin" /> : <ClipboardPaste className="size-4" />;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800">Clipboard</div>
          <div className="text-xs text-gray-500">Part number - narx*son</div>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onReadClipboard}>
          {importIcon}
          Olish
        </Button>
      </div>

      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={"1601100V0011 - 245*7\n1601200V6550XZ - 220*6"}
        className="min-h-20 resize-y bg-white font-mono text-xs"
        disabled={disabled}
      />

      <div className="mt-2 flex justify-end">
        <Button type="button" size="sm" disabled={disabled || !value.trim()} onClick={onParse}>
          {importing ? <Loader2 className="size-4 animate-spin" /> : <ClipboardPaste className="size-4" />}
          Parse qilish
        </Button>
      </div>
    </div>
  );
}

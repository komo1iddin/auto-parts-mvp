"use client";

import { useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";
import { ClipboardImportBox } from "./components/ClipboardImportBox";
import { ExcelImportDropzone } from "./components/ExcelImportDropzone";
import { ImportFeedback } from "./components/ImportFeedback";
import { ImportResolutionModal } from "./components/ImportResolutionModal";
import { useOrderImport } from "./hooks/useOrderImport";
import type { SupplierOption } from "./types";

interface OrderImportPanelProps {
  onImportItems: (items: OrderItem[]) => void;
  suppliers?: SupplierOption[];
}

export function OrderImportPanel({ onImportItems, suppliers = [] }: OrderImportPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const importer = useOrderImport({ onImportItems, suppliers });
  const importDisabled = importer.uploading || importer.importingClipboard;

  function handleFile(file: File) {
    void importer.importFile(file).finally(() => {
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-800">Import</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Excel yoki clipboarddan kelgan part number katalogdan tekshiriladi. Yangi zapchastlar buyurtma saqlanganda katalogga qo'shiladi.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={importDisabled} onClick={() => inputRef.current?.click()}>
          {importer.uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Yuklash
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ExcelImportDropzone
          uploading={importer.uploading}
          disabled={importDisabled}
          onPickFile={() => inputRef.current?.click()}
          onFile={handleFile}
        />
        <ClipboardImportBox
          value={importer.clipboardText}
          importing={importer.importingClipboard}
          disabled={importDisabled}
          onChange={importer.setClipboardText}
          onReadClipboard={() => void importer.readClipboardAndImport()}
          onParse={() => void importer.importClipboardText(importer.clipboardText)}
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <ImportFeedback
        summary={importer.summary}
        warnings={importer.warnings}
        error={importer.error}
        hasPendingResolution={Boolean(importer.resolution.pending)}
      />

      <ImportResolutionModal
        pendingResolution={importer.resolution.pending}
        resolving={importer.resolving}
        error={importer.error}
        suppliers={suppliers}
        bulkSupplierId={importer.resolution.bulkSupplierId}
        resolutionTypes={importer.resolution.types}
        resolutionPrices={importer.resolution.prices}
        resolutionSupplierIds={importer.resolution.supplierIds}
        onBulkSupplierChange={importer.resolution.setBulkSupplierId}
        onApplyBulkSupplier={importer.resolution.applyBulkSupplier}
        onTypeChange={importer.resolution.setType}
        onPriceChange={importer.resolution.setPrice}
        onSupplierChange={importer.resolution.setSupplierId}
        onCancel={importer.resolution.reset}
        onConfirm={() => void importer.confirmResolution()}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";
import { useImportResolution } from "./useImportResolution";
import type { ImportResponse, ImportSummary, ImportWarning, PendingResolution, SupplierOption } from "../types";

interface UseOrderImportParams {
  onImportItems: (items: OrderItem[]) => void;
  suppliers: SupplierOption[];
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

export function useOrderImport({ onImportItems, suppliers }: UseOrderImportParams) {
  const [uploading, setUploading] = useState(false);
  const [importingClipboard, setImportingClipboard] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");
  const [clipboardText, setClipboardText] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [warnings, setWarnings] = useState<ImportWarning[]>([]);
  const resolution = useImportResolution(suppliers);

  function resetFeedback() {
    setError("");
    setSummary(null);
    setWarnings([]);
  }

  function completeImport(data: ImportResponse, capturedRowKeys: string[]) {
    const hasOverrides = resolution.bulkSupplierId || Object.keys(resolution.supplierIds).length > 0;
    const items = (data.items ?? []).map((item, index) =>
      hasOverrides ? resolution.resolveItemSupplier(item, capturedRowKeys[index]) : item
    );
    onImportItems(items);
    setSummary(data.summary ?? null);
    setWarnings(data.warnings ?? []);
    resolution.reset();
  }

  function handleImportResponse(data: ImportResponse, capturedRowKeys: string[]) {
    if (data.requiresResolution) {
      resolution.open(data as PendingResolution);
      setWarnings(data.warnings ?? []);
      return;
    }

    completeImport(data, capturedRowKeys);
  }

  async function importFile(file: File) {
    setUploading(true);
    resetFeedback();
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/orders/import", { method: "POST", body: formData });
      const data = await readJson(response);
      if (!response.ok) {
        setError(data.error ?? "Excel import qilishda xatolik yuz berdi");
        return;
      }
      handleImportResponse(data, []);
    } catch {
      setError("Excel import qilishda xatolik yuz berdi");
    } finally {
      setUploading(false);
    }
  }

  async function importClipboardText(text: string) {
    setImportingClipboard(true);
    resetFeedback();
    try {
      const response = await fetch("/api/orders/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        setError(data.error ?? "Clipboard import qilishda xatolik yuz berdi");
        return;
      }
      handleImportResponse(data, []);
    } catch {
      setError("Clipboard import qilishda xatolik yuz berdi");
    } finally {
      setImportingClipboard(false);
    }
  }

  async function readClipboardAndImport() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      setError("Brauzer clipboardni avtomatik o'qiy olmadi. Matnni pastdagi maydonga paste qiling.");
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      setClipboardText(text);
      await importClipboardText(text);
    } catch {
      setError("Clipboardga ruxsat berilmadi. Matnni pastdagi maydonga paste qiling.");
    }
  }

  async function confirmResolution() {
    const resolutions = resolution.buildResolutions();
    if (!resolutions || !resolution.pending) return;
    if (resolutions.some((item) => !item.type)) {
      setError("Barcha muammoli partlar uchun tur tanlang");
      return;
    }

    setResolving(true);
    setError("");
    try {
      const capturedRowKeys = resolution.pending.rows.map((row) => row.rowKey);
      const response = await fetch("/api/orders/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: resolution.pending.rows, resolutions }),
      });
      const data = await readJson(response);
      if (!response.ok) {
        setError(data.error ?? "Import qilishda xatolik yuz berdi");
        return;
      }
      handleImportResponse(data, capturedRowKeys);
    } catch {
      setError("Import qilishda xatolik yuz berdi");
    } finally {
      setResolving(false);
    }
  }

  return {
    uploading,
    importingClipboard,
    resolving,
    error,
    clipboardText,
    summary,
    warnings,
    resolution,
    setClipboardText,
    importFile,
    importClipboardText,
    readClipboardAndImport,
    confirmResolution,
  };
}

"use client";

import { useState } from "react";
import { ChevronDown, FileSpreadsheet, Languages, Table2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AlertDialog } from "@/components/ui/AlertDialog";

interface ExportButtonsProps {
  orderId: string;
  supplierIds: string[];
  isAdmin?: boolean;
  latestExportLabel?: string;
}

export function ExportButtons({
  orderId,
  supplierIds,
  isAdmin = true,
  latestExportLabel,
}: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function doExport(type: string, language?: string, supplierId?: string) {
    const key = `${type}-${language ?? ""}-${supplierId ?? ""}`;
    setLoading(key);
    try {
      const res = await fetch(`/api/orders/${orderId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, language, supplierId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error ?? "Exportda xatolik");
        return;
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const fileName = match?.[1] ?? "export.xlsx";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }

  async function exportAllSuppliers(language: "cn" | "en") {
    for (const sid of supplierIds) {
      await doExport("supplier", language, sid);
    }
  }

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen((value) => !value)}
        disabled={Boolean(loading)}
      >
        <FileSpreadsheet className="size-4" />
        {loading ? "Export..." : "Export"}
        <ChevronDown className="size-4" />
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Export menyusini yopish"
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-40 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
            <div className="border-b border-gray-100 px-3 py-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Excel export</div>
              {latestExportLabel && (
                <div className="mt-0.5 truncate text-xs text-gray-500">Oxirgi: {latestExportLabel}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => doExport("internal")}
              disabled={loading === "internal--"}
              className="grid w-full grid-cols-[2rem_1fr] items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="flex size-8 items-center justify-center text-gray-500">
                <Table2 className="size-4" />
              </span>
              <span>
                <span className="block font-medium text-gray-900">Ichki Excel</span>
                <span className="block text-xs text-gray-500">Barcha narxlar va ichki ma'lumotlar</span>
              </span>
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => exportAllSuppliers("cn")}
                  disabled={loading?.startsWith("supplier-cn") || !supplierIds.length}
                  className="grid w-full grid-cols-[2rem_1fr] items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="flex size-8 items-center justify-center text-gray-500">
                    <FileSpreadsheet className="size-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-gray-900">Ta'minotchi Excel (CN)</span>
                    <span className="block text-xs text-gray-500">Har ta'minotchi uchun alohida fayl</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => exportAllSuppliers("en")}
                  disabled={loading?.startsWith("supplier-en") || !supplierIds.length}
                  className="grid w-full grid-cols-[2rem_1fr] items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="flex size-8 items-center justify-center text-gray-500">
                    <Languages className="size-4" />
                  </span>
                  <span>
                    <span className="block font-medium text-gray-900">Ta'minotchi Excel (EN)</span>
                    <span className="block text-xs text-gray-500">Supplier-facing English export</span>
                  </span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      <AlertDialog
        open={Boolean(errorMessage)}
        title="Export xatoligi"
        description={errorMessage}
        confirmLabel="Tushunarli"
        onConfirm={() => setErrorMessage("")}
      />
    </div>
  );
}

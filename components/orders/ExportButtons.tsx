"use client";

import { useState } from "react";
import { FileSpreadsheet, Languages, Table2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ExportButtonsProps {
  orderId: string;
  supplierIds: string[];
  isAdmin?: boolean;
}

export function ExportButtons({ orderId, supplierIds, isAdmin = true }: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

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
        alert(data.error ?? "Xatolik");
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Export</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => doExport("internal")}
          disabled={loading === "internal--"}
          title="Ichki Excel: barcha qatorlar, xarid/sotuv narxlari, ta'minotchi va izohlar kiradi; hech narsa yashirilmaydi."
        >
          <Table2 className="size-4" />
          Ichki Excel
        </Button>

        {isAdmin && (
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportAllSuppliers("cn")}
              disabled={loading?.startsWith("supplier-cn")}
              title="CN Excel: ta'minotchiga kerakli kod, nom, brend, tur, miqdor, xarid narxi va izoh kiradi; sotuv narxi, foyda va ichki ma'lumotlar yashiriladi."
            >
              <FileSpreadsheet className="size-4" />
              Ta'minotchi Excel (CN)
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => exportAllSuppliers("en")}
              disabled={loading?.startsWith("supplier-en")}
              title="EN Excel: ta'minotchiga kerakli kod, nom, brend, tur, miqdor, xarid narxi va izoh kiradi; sotuv narxi, foyda va ichki ma'lumotlar yashiriladi."
            >
              <Languages className="size-4" />
              Ta'minotchi Excel (EN)
            </Button>
          </>
        )}
      </div>

      {loading && (
        <p className="text-xs text-gray-400 mt-2">Yuklab olinmoqda...</p>
      )}
    </div>
  );
}

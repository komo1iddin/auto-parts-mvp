"use client";

import type { ImportSummary, ImportWarning } from "../types";

interface ImportFeedbackProps {
  summary: ImportSummary | null;
  warnings: ImportWarning[];
  error: string;
  hasPendingResolution: boolean;
}

export function ImportFeedback({ summary, warnings, error, hasPendingResolution }: ImportFeedbackProps) {
  return (
    <>
      {summary && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {summary.parsedCount} qator import qilindi. Katalogda bor: {summary.existingCount}. Yangi qo'shildi:{" "}
          {summary.createdCount} ta saqlashga tayyor.
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {warnings.slice(0, 5).map((warning) => (
            <div key={warning.rowKey}>
              <div className="font-medium">{warning.message}</div>
              <div className="text-amber-800">{warning.suggestedAction}</div>
            </div>
          ))}
          {warnings.length > 5 && <div>Yana {warnings.length - 5} ta ogohlantirish bor.</div>}
        </div>
      )}

      {error && !hasPendingResolution && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { RefreshConflictState } from "@/components/orders/types/orderBuilderTypes";
import { cn } from "@/lib/utils";

interface Props {
  state: RefreshConflictState | null;
  onApply: (choices: Record<string, "accept" | "keep">) => void;
  onCancel: () => void;
}

function formatValue(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export function PartRefreshConflictModal({ state, onApply, onCancel }: Props) {
  const [choices, setChoices] = useState<Record<string, "accept" | "keep">>({});

  // Reset choices whenever a new conflict set opens
  useEffect(() => {
    if (state) {
      const initial = Object.fromEntries(
        state.results.map((r) => [r.itemId, "accept" as const])
      );
      setChoices(initial);
    }
  }, [state]);

  if (!state) return null;

  const allAccepted = state.results.every((r) => (choices[r.itemId] ?? "accept") === "accept");
  const allKept = state.results.every((r) => (choices[r.itemId] ?? "accept") === "keep");

  function setChoice(itemId: string, choice: "accept" | "keep") {
    setChoices((prev) => ({ ...prev, [itemId]: choice }));
  }

  function setAll(choice: "accept" | "keep") {
    const next = Object.fromEntries(state!.results.map((r) => [r.itemId, choice]));
    setChoices(next);
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Ma'lumotlardagi farqlar"
      className="max-w-3xl"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Quyidagi qismlar uchun katalogdagi ma&apos;lumotlar buyurtmadagi ma&apos;lumotlardan farq
          qiladi. Har bir qism uchun katalog ma&apos;lumotlarini qabul qilish yoki hozirgilarni
          saqlab qolishni tanlang.
        </p>

        {/* Bulk actions */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Hammasiga:</span>
          <button
            type="button"
            onClick={() => setAll("accept")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              allAccepted
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <Check className="size-3" />
            Yangilarni qabul qilish
          </button>
          <button
            type="button"
            onClick={() => setAll("keep")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              allKept
                ? "border-gray-400 bg-gray-100 text-gray-800"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <Minus className="size-3" />
            Hozirgilarni saqlash
          </button>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {state.results.map((result) => {
            const choice = choices[result.itemId] ?? "accept";
            return (
              <div
                key={result.itemId}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  choice === "accept" ? "border-green-200 bg-green-50/50" : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-gray-800">
                        {result.partCode}
                      </span>
                      {result.partName && (
                        <span className="text-xs text-gray-500">{result.partName}</span>
                      )}
                    </div>
                    {result.supplierNotFound && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="size-3.5" />
                        Ta&apos;minotchi bu qism uchun narx bermagan
                      </div>
                    )}
                    {result.conflicts.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {result.conflicts.map((conflict) => (
                          <div key={String(conflict.field)} className="flex items-center gap-2 text-xs">
                            <span className="w-32 shrink-0 text-gray-500">{conflict.label}:</span>
                            <span className="text-gray-400 line-through">
                              {formatValue(conflict.currentValue)}
                            </span>
                            <span className="text-gray-300">→</span>
                            <span className="font-medium text-gray-700">
                              {formatValue(conflict.latestValue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.autoUpdates && Object.keys(result.autoUpdates).length > 0 && (
                      <div className="mt-2 text-xs text-gray-400">
                        Avtomatik yangilanadi: {Object.keys(result.autoUpdates).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setChoice(result.itemId, "accept")}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        choice === "accept"
                          ? "border-green-400 bg-green-500 text-white"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      Yangilash
                    </button>
                    <button
                      type="button"
                      onClick={() => setChoice(result.itemId, "keep")}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                        choice === "keep"
                          ? "border-gray-500 bg-gray-700 text-white"
                          : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      Saqlab qolish
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button onClick={() => onApply(choices)}>
            Qo&apos;llash
          </Button>
        </div>
      </div>
    </Modal>
  );
}

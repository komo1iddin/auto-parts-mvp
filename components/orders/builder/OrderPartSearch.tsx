"use client";

import { Input } from "@/components/ui/Input";
import type { OrderItem, PartSearchResult } from "@/components/orders/types/orderBuilderTypes";
import { PART_TYPES, formatCny } from "@/lib/utils";

interface OrderPartSearchProps {
  query: string;
  searching: boolean;
  results: PartSearchResult[];
  items: OrderItem[];
  onQueryChange: (query: string) => void;
  onAddPart: (part: PartSearchResult) => void;
}

export function OrderPartSearch({
  query,
  searching,
  results,
  items,
  onQueryChange,
  onAddPart,
}: OrderPartSearchProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 font-semibold text-gray-800">Qism qidirish</h2>
      <div className="relative max-w-sm">
        <Input
          placeholder="Qism kodi, nomi yoki brend..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {searching && <p className="mt-1 text-xs text-gray-400">Qidirilmoqda...</p>}
        {results.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
            {results.map((part) => {
              const alreadyInOrder = items.some((item) => item.partVariantId === part.id);
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => onAddPart(part)}
                  className="flex w-full cursor-pointer items-center gap-3 border-b border-gray-50 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-blue-50"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-gray-800">{part.code}</span>
                    {part.name && <span className="ml-2 text-xs text-gray-500">{part.name}</span>}
                    {part.brand && <span className="ml-1 text-xs text-gray-400">• {part.brand}</span>}
                  </div>
                  {alreadyInOrder && (
                    <span className="shrink-0 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                      mavjud
                    </span>
                  )}
                  <span className="shrink-0 text-xs text-gray-400">{PART_TYPES[part.type]}</span>
                  {part.sellingPriceCny && (
                    <span className="shrink-0 text-xs font-medium text-blue-600">
                      {formatCny(part.sellingPriceCny)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

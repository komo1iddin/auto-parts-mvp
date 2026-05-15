"use client";

import { Search } from "lucide-react";
import { ORDER_STATUS_OPTIONS, ORDER_STATUSES } from "@/lib/utils";

interface OrdersListToolbarProps {
  status: string;
  statusCounts?: Record<string, number>;
  search: string;
  isPending: boolean;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
}

const ALL_TABS = [
  { value: "", label: "Barchasi" },
  ...ORDER_STATUS_OPTIONS.map((s) => ({ value: s.value, label: ORDER_STATUSES[s.value]?.label ?? s.value })),
];

export function OrdersListToolbar({
  status,
  statusCounts,
  search,
  isPending,
  onStatusChange,
  onSearchChange,
}: OrdersListToolbarProps) {
  return (
    <div className="border-b border-gray-100">
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-0.5">
            {ALL_TABS.map((tab) => {
              const count = statusCounts?.[tab.value];
              const isActive = status === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => onStatusChange(tab.value)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  {count != null && count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-px text-[10px] font-semibold leading-none tabular-nums ${
                        isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative shrink-0">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Qidirish..."
            className="h-8 w-48 rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-100 placeholder:text-gray-400"
          />
        </div>

        {isPending && (
          <span className="shrink-0 text-xs text-gray-400">Yangilanmoqda...</span>
        )}
      </div>
    </div>
  );
}

import type { FinanceTabKey } from "@/components/orders/types/orderFinanceTypes";
import { cn } from "@/lib/utils";

interface FinanceTabsProps {
  tabs: { key: FinanceTabKey; label: string }[];
  activeTab: FinanceTabKey;
  onChange: (tab: FinanceTabKey) => void;
}

export function FinanceTabs({ tabs, activeTab, onChange }: FinanceTabsProps) {
  return (
    <div className="inline-flex gap-0.5 rounded-full bg-gray-100 p-1">
      {tabs.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            activeTab === item.key
              ? "rounded-full bg-gray-950 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

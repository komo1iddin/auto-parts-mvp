import { cn, formatCny } from "@/lib/utils";
import { valueTone } from "@/components/orders/orderFinanceUtils";

interface FinanceBlockProps {
  label: string;
  status?: string;
  total: number;
  items: { label: string; value: number; className?: string }[];
  featured?: boolean;
}

export function FinanceBlock({ label, status, total, items, featured = false }: FinanceBlockProps) {
  return (
    <div className={cn("border border-gray-200 bg-white px-4 py-3", featured && "border-green-200 bg-green-50/50")}>
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </span>
        {status && (
          <>
            <span className="text-[11px] font-semibold text-gray-300">·</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{status}</span>
          </>
        )}
      </div>
      <div className={cn("text-2xl font-semibold leading-7 tracking-tight text-gray-950", featured && valueTone(total))}>
        {formatCny(total)}
      </div>
      <div className="mt-2 space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-[13px] leading-5">
            <span className="text-gray-500">{item.label}</span>
            <span className={cn("font-semibold text-gray-900", item.className)}>
              {formatCny(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

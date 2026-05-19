import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OrderSection({
  icon,
  title,
  badge,
  action,
  children,
}: {
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="px-5 py-4">
        <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
              {icon}
            </span>
            <h2 className="truncate text-base font-semibold text-gray-950">{title}</h2>
            {badge}
          </div>
          {action}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

export function OrderMetricStrip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex w-full flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-gray-100 bg-gray-50/70 px-4 py-3", className)}>
      {children}
    </div>
  );
}

export function OrderMetric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="flex min-w-24 items-baseline gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className={cn("text-base font-semibold tabular-nums text-gray-950", valueClassName)}>{value}</span>
    </div>
  );
}

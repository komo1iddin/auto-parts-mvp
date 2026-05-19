import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OrderSectionActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
}

export function OrderSectionActionButton({
  icon,
  className,
  children,
  ...props
}: OrderSectionActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-44 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-800 shadow-xs transition-colors",
        "hover:border-gray-300 hover:bg-gray-50 hover:text-gray-950",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="text-gray-700 [&>svg]:size-4">{icon}</span>
      {children}
    </button>
  );
}

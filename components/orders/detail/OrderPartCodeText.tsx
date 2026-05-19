import { cn } from "@/lib/utils";

export function OrderPartCodeText({ code, className }: { code: string; className?: string }) {
  return (
    <span className={cn("font-sans text-[15px] font-semibold tabular-nums text-blue-700", className)}>
      {code}
    </span>
  );
}

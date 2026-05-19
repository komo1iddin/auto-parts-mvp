import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OrderFinanceSummary } from "@/lib/order-finance";
import { cn, formatCny } from "@/lib/utils";

interface SupplierSettlementCardsProps {
  rows: OrderFinanceSummary["supplierBreakdown"];
  onPaySupplier: (supplierId: string) => void;
}

export function SupplierSettlementCards({ rows, onPaySupplier }: SupplierSettlementCardsProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-950">Ta'minotchi hisob-kitoblari</h2>
        <p className="mt-0.5 text-xs text-gray-500">Har bir ta'minotchi bo'yicha to'langan va qarz.</p>
      </div>
      <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const settled = row.supplierBalance <= 0;
          return (
            <article key={row.supplierId ?? "no-supplier"} className="rounded-md border border-gray-200 bg-gray-50/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-gray-950">{row.supplierName}</h3>
                  <div className="mt-0.5 text-xs text-gray-500">{row.itemCount} ta qism</div>
                </div>
                <span
                  className={cn(
                    "inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold",
                    settled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}
                >
                  {settled && <CheckCircle2 className="size-3" />}
                  {settled ? "to'langan" : "qarz"}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                <SettlementRow label="Jami" value={row.supplierTotal} />
                <SettlementRow label="To'landi" value={row.supplierPaid} className="text-green-700" />
                <SettlementRow
                  label="Qarz"
                  value={row.supplierBalance}
                  className={row.supplierBalance > 0 ? "text-red-700" : "text-green-700"}
                />
              </div>
              {row.supplierId && !settled && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 h-8 w-full justify-between bg-white"
                  onClick={() => onPaySupplier(row.supplierId!)}
                >
                  Ta'minotchiga to'lash
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
            </article>
          );
        })}
        {rows.length === 0 && (
          <div className="col-span-full px-1 py-5 text-sm text-gray-500">
            Buyurtma itemlarida ta'minotchi biriktirilmagan.
          </div>
        )}
      </div>
    </section>
  );
}

function SettlementRow({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-gray-500">{label}</span>
      <span className={cn("font-semibold tabular-nums text-gray-950", className)}>{formatCny(value)}</span>
    </div>
  );
}

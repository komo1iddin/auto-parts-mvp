import { Button } from "@/components/ui/Button";
import type { OrderFinanceSummary } from "@/lib/order-finance";
import { cn, formatCny } from "@/lib/utils";

interface SupplierBreakdownTableProps {
  rows: OrderFinanceSummary["supplierBreakdown"];
  onPaySupplier: (supplierId: string) => void;
}

export function SupplierBreakdownTable({ rows, onPaySupplier }: SupplierBreakdownTableProps) {
  return (
    <div className="max-w-5xl overflow-hidden border border-gray-200 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">Ta'minotchi</th>
            <th className="h-9 px-3 text-center text-[11px] font-semibold uppercase text-gray-400">Qismlar</th>
            <th className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-gray-400">Jami</th>
            <th className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-gray-400">To'landi</th>
            <th className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-gray-400">Qoldiq</th>
            <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">Holat</th>
            <th className="h-9 px-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => {
            const paid = row.supplierBalance <= 0;
            return (
              <tr key={row.supplierId ?? "no-supplier"} className="hover:bg-gray-50/50">
                <td className="h-10 px-3 font-medium text-gray-900">{row.supplierName}</td>
                <td className="h-10 px-3 text-center text-gray-500">{row.itemCount}</td>
                <td className="h-10 px-3 text-right font-medium text-gray-800">{formatCny(row.supplierTotal)}</td>
                <td className="h-10 px-3 text-right font-semibold text-green-600">{formatCny(row.supplierPaid)}</td>
                <td className={cn("h-10 px-3 text-right font-semibold", row.supplierBalance > 0 ? "text-red-600" : "text-green-600")}>
                  {formatCny(row.supplierBalance)}
                </td>
                <td className={cn("h-10 px-3 text-left font-medium", paid ? "text-green-600" : "text-red-600")}>
                  {paid ? "Paid" : "Unpaid"}
                </td>
                <td className="h-10 px-3 text-right">
                  {row.supplierId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => onPaySupplier(row.supplierId!)}
                    >
                      Pay Supplier
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                Buyurtma itemlarida ta'minotchi biriktirilmagan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { PaymentKind, PaymentRecord } from "@/components/orders/types/orderFinanceTypes";
import { formatDate } from "@/components/orders/finance/orderFinanceUtils";
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/order-finance";
import { formatCny } from "@/lib/utils";

interface PaymentTableProps {
  kind: PaymentKind;
  payments: PaymentRecord[];
  canCreate: boolean;
  canEdit: boolean;
  onCreate: () => void;
  onEdit: (payment: PaymentRecord) => void;
  onDelete: (payment: PaymentRecord) => void;
}

export function PaymentTable({
  kind,
  payments,
  canCreate,
  canEdit,
  onCreate,
  onEdit,
  onDelete,
}: PaymentTableProps) {
  const colSpan = (kind === "supplier" ? 6 : 5) + (canEdit ? 1 : 0);

  return (
    <div className="max-w-4xl overflow-hidden border border-gray-200 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {kind === "supplier" && (
              <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">Ta'minotchi</th>
            )}
            <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">Sana</th>
            <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">Usul</th>
            <th className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-gray-400">Miqdor</th>
            <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">Izoh</th>
            <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">Kiritdi</th>
            {canEdit && <th className="h-9 px-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50/50">
              {kind === "supplier" && (
                <td className="h-10 px-3 font-medium text-gray-900">{payment.supplier?.name ?? "—"}</td>
              )}
              <td className="h-10 px-3 text-gray-600">{formatDate(payment.paymentDate)}</td>
              <td className="h-10 px-3 text-gray-600">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethod] ?? payment.paymentMethod}
              </td>
              <td className="h-10 px-3 text-right font-semibold text-green-600">
                {formatCny(String(payment.amountCny))}
              </td>
              <td className="h-10 max-w-[140px] truncate px-3 text-gray-500">{payment.note ?? "—"}</td>
              <td className="h-10 px-3 text-gray-500">{payment.creator?.name ?? "—"}</td>
              {canEdit && (
                <td className="h-10 px-3">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Tahrirlash" onClick={() => onEdit(payment)}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-red-600 hover:bg-gray-100"
                      aria-label="O'chirish"
                      onClick={() => onDelete(payment)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-8 text-center">
                <div className="text-[13px] text-gray-500">
                  No {kind === "client" ? "client" : "supplier"} payments yet
                </div>
                {canCreate && (
                  <Button type="button" size="sm" className="mt-3 h-8" onClick={onCreate}>
                    <Plus className="size-4" />
                    Add First Payment
                  </Button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {payments.length > 0 && canCreate && (
        <div className="flex justify-end border-t border-gray-100 px-3 py-2">
          <Button size="sm" className="h-8" onClick={onCreate}>
            <Plus className="size-4" />
            Add Payment
          </Button>
        </div>
      )}
    </div>
  );
}

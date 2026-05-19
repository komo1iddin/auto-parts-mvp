import { Button } from "@/components/ui/Button";
import { CalendarInput } from "@/components/ui/CalendarInput";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type {
  PaymentForm,
  PaymentKind,
  SupplierOption,
} from "@/components/orders/types/orderFinanceTypes";
import {
  type OrderFinanceSummary,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/order-finance";
import { formatCny } from "@/lib/utils";

interface PaymentFormModalProps {
  open: boolean;
  kind: PaymentKind | null;
  form: PaymentForm;
  suppliers: SupplierOption[];
  supplierBreakdown: OrderFinanceSummary["supplierBreakdown"];
  saving: boolean;
  canChooseClient: boolean;
  canChooseSupplier: boolean;
  canChooseProfit: boolean;
  availableSupplierCash: number;
  availableProfit: number;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: PaymentForm) => void;
  onKindChange: (kind: PaymentKind) => void;
}

export function PaymentFormModal({
  open,
  kind,
  form,
  suppliers,
  supplierBreakdown,
  saving,
  canChooseClient,
  canChooseSupplier,
  canChooseProfit,
  availableSupplierCash,
  availableProfit,
  onClose,
  onSave,
  onFormChange,
  onKindChange,
}: PaymentFormModalProps) {
  const selectedSupplier = supplierBreakdown.find((supplier) => supplier.supplierId === form.supplierId);
  const supplierDebt = Math.max(0, selectedSupplier?.supplierBalance ?? 0);
  const suggestedSupplierPayment = Math.min(supplierDebt || availableSupplierCash, availableSupplierCash);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form.id ? "Tranzaksiyani tahrirlash" : "Yangi tranzaksiya"}
    >
      <div className="space-y-4">
        {!form.id && (
          <Select
            label="Turi"
            value={kind ?? "client"}
            onChange={(event) => onKindChange(event.target.value as PaymentKind)}
          >
            <option value="client" disabled={!canChooseClient}>
              Mijoz to'lovi
            </option>
            <option value="refund" disabled={!canChooseClient}>
              Qaytarim
            </option>
            <option value="supplier" disabled={!canChooseSupplier}>
              {suppliers.length ? "Ta'minotchi to'lovi" : "Ta'minotchi to'lovi (ta'minotchi yo'q)"}
            </option>
            <option value="profit" disabled={!canChooseProfit}>
              Foydani olish
            </option>
          </Select>
        )}
        {kind === "supplier" && (
          <Select
            label="Ta'minotchi"
            value={form.supplierId}
            disabled={!suppliers.length}
            onChange={(event) => onFormChange({ ...form, supplierId: event.target.value })}
          >
            {suppliers.length ? (
              suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))
            ) : (
              <option value="">Buyurtmada ta'minotchi yo'q</option>
            )}
          </Select>
        )}
        {kind === "supplier" && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <div className="flex items-center justify-between gap-3">
              <span>Mijozdan qolgan pul</span>
              <span className="font-semibold text-gray-950">{formatCny(availableSupplierCash)}</span>
            </div>
            {selectedSupplier && (
              <div className="mt-1 flex items-center justify-between gap-3">
                <span>{selectedSupplier.supplierName} qarzi</span>
                <span className="font-semibold text-red-700">{formatCny(supplierDebt)}</span>
              </div>
            )}
            {suggestedSupplierPayment > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-7 bg-white text-xs"
                onClick={() => onFormChange({ ...form, amountCny: String(suggestedSupplierPayment) })}
              >
                {formatCny(suggestedSupplierPayment)} to'lash
              </Button>
            )}
          </div>
        )}
        {kind === "profit" && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <div className="flex items-center justify-between gap-3">
              <span>Olish mumkin bo'lgan foyda</span>
              <span className="font-semibold text-green-700">{formatCny(availableProfit)}</span>
            </div>
            {availableProfit > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-2 h-7 bg-white text-xs"
                onClick={() => onFormChange({ ...form, amountCny: String(availableProfit) })}
              >
                {formatCny(availableProfit)} olish
              </Button>
            )}
          </div>
        )}
        <Input
          label="Miqdor (CNY)"
          type="number"
          min="0"
          step="0.01"
          value={form.amountCny}
          onChange={(event) => onFormChange({ ...form, amountCny: event.target.value })}
        />
        <CalendarInput
          label="To'lov sanasi"
          value={form.paymentDate}
          onChange={(paymentDate) => onFormChange({ ...form, paymentDate })}
        />
        <Select
          label="Usul"
          value={form.paymentMethod}
          onChange={(event) => onFormChange({ ...form, paymentMethod: event.target.value as PaymentMethod })}
        >
          {PAYMENT_METHODS.map((method) => (
            <option key={method} value={method}>
              {PAYMENT_METHOD_LABELS[method]}
            </option>
          ))}
        </Select>
        <Textarea
          label="Izoh"
          value={form.note}
          onChange={(event) => onFormChange({ ...form, note: event.target.value })}
        />
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onSave}
            disabled={
              saving ||
              !form.amountCny ||
              Number(form.amountCny) <= 0 ||
              !form.paymentDate ||
              (kind === "supplier" && Number(form.amountCny) > availableSupplierCash) ||
              (kind === "profit" && Number(form.amountCny) > availableProfit) ||
              (kind === "supplier" && !form.supplierId)
            }
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Bekor
          </Button>
        </div>
      </div>
    </Modal>
  );
}

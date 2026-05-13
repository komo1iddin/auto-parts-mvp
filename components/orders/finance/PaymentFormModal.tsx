import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type {
  PaymentForm,
  PaymentKind,
  SupplierOption,
} from "@/components/orders/types/orderFinanceTypes";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/order-finance";

interface PaymentFormModalProps {
  open: boolean;
  kind: PaymentKind | null;
  form: PaymentForm;
  suppliers: SupplierOption[];
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (form: PaymentForm) => void;
}

export function PaymentFormModal({
  open,
  kind,
  form,
  suppliers,
  saving,
  onClose,
  onSave,
  onFormChange,
}: PaymentFormModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form.id ? "To'lovni tahrirlash" : "Yangi to'lov"}
    >
      <div className="space-y-4">
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
        <Input
          label="Miqdor (CNY)"
          type="number"
          min="0"
          step="0.01"
          value={form.amountCny}
          onChange={(event) => onFormChange({ ...form, amountCny: event.target.value })}
        />
        <Input
          label="To'lov sanasi"
          type="date"
          value={form.paymentDate}
          onChange={(event) => onFormChange({ ...form, paymentDate: event.target.value })}
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
        <Input
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

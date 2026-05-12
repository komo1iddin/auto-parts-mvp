"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type OrderFinanceSummary,
  type PaymentMethod,
  type PaymentStatus,
  type OrderFinanceStatus,
} from "@/lib/order-finance";
import { cn, formatCny } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  amountCny: string | number | { toString(): string };
  paymentDate: Date | string;
  paymentMethod: string;
  note: string | null;
  createdAt: Date | string;
  creator?: { name: string } | null;
  supplierId?: string | null;
  supplier?: { name: string } | null;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface OrderFinancePanelProps {
  orderId: string;
  isAdmin: boolean;
  canManageClientPayments: boolean;
  summary: OrderFinanceSummary;
  clientPayments: PaymentRecord[];
  supplierPayments: PaymentRecord[];
  suppliers: SupplierOption[];
}

type PaymentKind = "client" | "supplier";

interface PaymentForm {
  id?: string;
  supplierId: string;
  amountCny: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note: string;
}

const CLIENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "To'lanmagan",
  partially_paid: "Qisman to'langan",
  paid: "To'langan",
  overpaid: "Ortiqcha to'langan",
};

const FINANCE_STATUS_LABELS: Record<OrderFinanceStatus, string> = {
  waiting_client_payment: "Mijoz to'lovi kutilmoqda",
  client_partially_paid: "Mijoz qisman to'lagan",
  ready_to_pay_supplier: "Ta'minotchiga to'lash mumkin",
  supplier_partially_paid: "Ta'minotchi qisman to'langan",
  supplier_paid: "Ta'minotchi to'langan",
  closed: "Yopilgan",
};

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("uz");
}

function statusClass(status: PaymentStatus | OrderFinanceStatus) {
  if (status === "paid" || status === "closed" || status === "supplier_paid") {
    return "bg-green-100 text-green-700";
  }
  if (status === "overpaid" || status === "ready_to_pay_supplier") {
    return "bg-blue-100 text-blue-700";
  }
  if (status === "partially_paid" || status === "client_partially_paid" || status === "supplier_partially_paid") {
    return "bg-yellow-100 text-yellow-700";
  }
  return "bg-gray-100 text-gray-700";
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "blue" }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div
        className={cn(
          "mt-0.5 text-sm font-semibold text-gray-900",
          tone === "green" && "text-green-600",
          tone === "red" && "text-red-600",
          tone === "blue" && "text-blue-600"
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function OrderFinancePanel({
  orderId,
  isAdmin,
  canManageClientPayments,
  summary,
  clientPayments,
  supplierPayments,
  suppliers,
}: OrderFinancePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"summary" | "suppliers" | "client" | "supplier">("summary");
  const [modalKind, setModalKind] = useState<PaymentKind | null>(null);
  const [form, setForm] = useState<PaymentForm>({
    supplierId: suppliers[0]?.id ?? "",
    amountCny: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  const visibleMetrics = useMemo(() => {
    const clientMetrics = [
      { label: "Mijoz jami", value: formatCny(summary.clientTotal), tone: "green" as const },
      { label: "Mijoz to'ladi", value: formatCny(summary.clientPaid), tone: "blue" as const },
      { label: "Mijoz qoldiq", value: formatCny(summary.clientBalance), tone: summary.clientBalance > 0 ? "red" as const : "green" as const },
    ];
    if (!isAdmin) return clientMetrics;
    return [
      ...clientMetrics,
      { label: "Ta'minot jami", value: formatCny(summary.supplierTotal), tone: "red" as const },
      { label: "Kutilgan foyda", value: formatCny(summary.expectedGrossProfit), tone: summary.expectedGrossProfit >= 0 ? "green" as const : "red" as const },
      { label: "Ta'minot to'landi", value: formatCny(summary.supplierPaid), tone: "blue" as const },
      { label: "Ta'minot qoldiq", value: formatCny(summary.supplierBalance), tone: summary.supplierBalance > 0 ? "red" as const : "green" as const },
      { label: "Naqd farqi", value: formatCny(summary.cashDifference), tone: summary.cashDifference >= 0 ? "green" as const : "red" as const },
    ];
  }, [isAdmin, summary]);

  function openCreate(kind: PaymentKind) {
    setModalKind(kind);
    setForm({
      supplierId: suppliers[0]?.id ?? "",
      amountCny: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "cash",
      note: "",
    });
  }

  function openEdit(kind: PaymentKind, payment: PaymentRecord) {
    setModalKind(kind);
    setForm({
      id: payment.id,
      supplierId: payment.supplierId ?? suppliers[0]?.id ?? "",
      amountCny: String(payment.amountCny),
      paymentDate: toDateInput(payment.paymentDate),
      paymentMethod: PAYMENT_METHODS.includes(payment.paymentMethod as PaymentMethod)
        ? payment.paymentMethod as PaymentMethod
        : "other",
      note: payment.note ?? "",
    });
  }

  async function savePayment() {
    if (!modalKind) return;
    setSaving(true);
    const base = `/api/orders/${orderId}/${modalKind}-payments`;
    const url = form.id ? `${base}/${form.id}` : base;
    const res = await fetch(url, {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCny: Number(form.amountCny),
        paymentDate: form.paymentDate,
        paymentMethod: form.paymentMethod,
        note: form.note,
        supplierId: form.supplierId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      alert(data.error ?? "To'lovni saqlashda xatolik");
      return;
    }
    setModalKind(null);
    startTransition(() => router.refresh());
  }

  async function deletePayment(kind: PaymentKind, payment: PaymentRecord) {
    if (!confirm("To'lov yozuvini o'chirishni tasdiqlaysizmi?")) return;
    const res = await fetch(`/api/orders/${orderId}/${kind}-payments/${payment.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "To'lovni o'chirishda xatolik");
      return;
    }
    startTransition(() => router.refresh());
  }

  const canOpenSupplierTabs = isAdmin;
  const canCreateClient = isAdmin || canManageClientPayments;

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex size-9 items-center justify-center rounded-md bg-blue-50 text-blue-700">
              <CreditCard className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-gray-900">Moliya</h2>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(summary.clientPaymentStatus))}>
                  {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
                </span>
                {isAdmin && (
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusClass(summary.orderFinanceStatus))}>
                    {FINANCE_STATUS_LABELS[summary.orderFinanceStatus]}
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>Mijoz jami: <b className="text-gray-800">{formatCny(summary.clientTotal)}</b></span>
                <span>To'langan: <b className="text-gray-800">{formatCny(summary.clientPaid)}</b></span>
                <span>Qoldiq: <b className={summary.clientBalance > 0 ? "text-red-600" : "text-green-600"}>{formatCny(summary.clientBalance)}</b></span>
              </div>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            <CreditCard className="size-4" />
            Moliya paneli
          </Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Order Finance" className="max-w-6xl">
        <div className="space-y-5">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {visibleMetrics.map((metric) => (
              <Metric key={metric.label} {...metric} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-gray-100">
            {[
              ["summary", "Xulosa"],
              ...(canOpenSupplierTabs ? [["suppliers", "Ta'minotchi balans"]] : []),
              ["client", "Mijoz to'lovlari"],
              ...(canOpenSupplierTabs ? [["supplier", "Ta'minotchi to'lovlari"]] : []),
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key as typeof tab)}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm font-medium",
                  tab === key
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                )}
              >
                {label}
              </button>
            ))}
            {isPending && <span className="ml-auto py-2 text-xs text-gray-400">Yangilanmoqda...</span>}
          </div>

          {tab === "summary" && (
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 p-3">
                <div className="text-xs font-medium uppercase text-gray-400">Mijoz holati</div>
                <div className="mt-1 font-semibold text-gray-800">{CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}</div>
              </div>
              {isAdmin && (
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-xs font-medium uppercase text-gray-400">Finance holati</div>
                  <div className="mt-1 font-semibold text-gray-800">{FINANCE_STATUS_LABELS[summary.orderFinanceStatus]}</div>
                </div>
              )}
            </div>
          )}

          {tab === "suppliers" && isAdmin && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ta'minotchi</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Qismlar</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Jami</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">To'landi</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Qoldiq</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.supplierBreakdown.map((row) => (
                    <tr key={row.supplierId ?? "no-supplier"} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.supplierName}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{row.itemCount}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">{formatCny(row.supplierTotal)}</td>
                      <td className="px-4 py-3 text-right font-medium text-blue-600">{formatCny(row.supplierPaid)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCny(row.supplierBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === "client" && (
            <PaymentTable
              kind="client"
              payments={clientPayments}
              canCreate={canCreateClient}
              canEdit={isAdmin}
              onCreate={() => openCreate("client")}
              onEdit={(payment) => openEdit("client", payment)}
              onDelete={(payment) => deletePayment("client", payment)}
            />
          )}

          {tab === "supplier" && isAdmin && (
            <PaymentTable
              kind="supplier"
              payments={supplierPayments}
              canCreate={isAdmin}
              canEdit={isAdmin}
              onCreate={() => openCreate("supplier")}
              onEdit={(payment) => openEdit("supplier", payment)}
              onDelete={(payment) => deletePayment("supplier", payment)}
            />
          )}
        </div>
      </Modal>

      <Modal
        open={modalKind != null}
        onClose={() => setModalKind(null)}
        title={form.id ? "To'lovni tahrirlash" : "Yangi to'lov"}
      >
        <div className="space-y-4">
          {modalKind === "supplier" && (
            <Select
              label="Ta'minotchi"
              value={form.supplierId}
              onChange={(event) => setForm((current) => ({ ...current, supplierId: event.target.value }))}
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </Select>
          )}
          <Input
            label="Miqdor (CNY)"
            type="number"
            min="0"
            step="0.01"
            value={form.amountCny}
            onChange={(event) => setForm((current) => ({ ...current, amountCny: event.target.value }))}
          />
          <Input
            label="To'lov sanasi"
            type="date"
            value={form.paymentDate}
            onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))}
          />
          <Select
            label="Usul"
            value={form.paymentMethod}
            onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value as PaymentMethod }))}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</option>
            ))}
          </Select>
          <Input
            label="Izoh"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={savePayment} disabled={saving || !form.amountCny || Number(form.amountCny) <= 0}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="secondary" onClick={() => setModalKind(null)}>Bekor</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function PaymentTable({
  kind,
  payments,
  canCreate,
  canEdit,
  onCreate,
  onEdit,
  onDelete,
}: {
  kind: PaymentKind;
  payments: PaymentRecord[];
  canCreate: boolean;
  canEdit: boolean;
  onCreate: () => void;
  onEdit: (payment: PaymentRecord) => void;
  onDelete: (payment: PaymentRecord) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {canCreate && (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" />
            To'lov qo'shish
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {kind === "supplier" && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Ta'minotchi</th>}
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Sana</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Usul</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Miqdor</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Izoh</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Kiritdi</th>
              {canEdit && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-gray-50">
                {kind === "supplier" && <td className="px-4 py-3 font-medium text-gray-800">{payment.supplier?.name ?? "—"}</td>}
                <td className="px-4 py-3 text-gray-600">{formatDate(payment.paymentDate)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethod] ?? payment.paymentMethod}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-blue-600">{formatCny(String(payment.amountCny))}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-gray-500">{payment.note ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{payment.creator?.name ?? "—"}</td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" aria-label="Tahrirlash" onClick={() => onEdit(payment)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" aria-label="O'chirish" onClick={() => onDelete(payment)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {!payments.length && (
              <tr>
                <td colSpan={(kind === "supplier" ? 6 : 5) + (canEdit ? 1 : 0)} className="px-4 py-8 text-center text-gray-400">
                  To'lovlar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

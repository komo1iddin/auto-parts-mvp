"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertDialog } from "@/components/ui/AlertDialog";
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

interface OrderFinancePageProps {
  orderId: string;
  orderNumber: string;
  backPath: string;
  isAdmin: boolean;
  canManageClientPayments: boolean;
  summary: OrderFinanceSummary;
  clientPayments: PaymentRecord[];
  supplierPayments: PaymentRecord[];
  suppliers: SupplierOption[];
}

type PaymentKind = "client" | "supplier";
type TabKey = "suppliers" | "client" | "supplier";

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
  partially_paid: "Qisman",
  paid: "To'langan",
  overpaid: "Ortiqcha",
};

const FINANCE_STATUS_LABELS: Record<OrderFinanceStatus, string> = {
  waiting_client_payment: "Mijoz kutilmoqda",
  client_partially_paid: "Mijoz qisman",
  ready_to_pay_supplier: "Ta'minotchiga to'lash mumkin",
  supplier_partially_paid: "Ta'minotchi qisman",
  supplier_paid: "Ta'minotchi to'langan",
  closed: "Yopilgan",
};

function statusTextClass(status: PaymentStatus | OrderFinanceStatus) {
  if (status === "paid" || status === "closed" || status === "supplier_paid") return "text-green-600";
  if (status === "unpaid" || status === "waiting_client_payment") return "text-red-600";
  return "text-gray-900";
}

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("uz");
}

function valueTone(value: number, positiveIsGood = true) {
  if (value === 0) return "text-gray-900";
  if (positiveIsGood) return value > 0 ? "text-green-600" : "text-red-600";
  return value > 0 ? "text-red-600" : "text-green-600";
}

function FinanceBlock({
  label,
  status,
  total,
  items,
  featured = false,
}: {
  label: string;
  status?: string;
  total: number;
  items: { label: string; value: number; className?: string }[];
  featured?: boolean;
}) {
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
            <span
              className={cn(
                "font-semibold text-gray-900",
                item.className
              )}
            >
              {formatCny(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrderFinancePage({
  orderId,
  orderNumber,
  backPath,
  isAdmin,
  canManageClientPayments,
  summary,
  clientPayments,
  supplierPayments,
  suppliers,
}: OrderFinancePageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<TabKey>(isAdmin ? "suppliers" : "client");
  const [modalKind, setModalKind] = useState<PaymentKind | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: PaymentKind;
    payment: PaymentRecord;
  } | null>(null);
  const [form, setForm] = useState<PaymentForm>({
    supplierId: suppliers[0]?.id ?? "",
    amountCny: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const canCreateClient = isAdmin || canManageClientPayments;

  const tabs: { key: TabKey; label: string }[] = [
    ...(isAdmin ? [{ key: "suppliers" as TabKey, label: "Ta'minotchilar" }] : []),
    { key: "client", label: "Mijoz to'lovlari" },
    ...(isAdmin ? [{ key: "supplier" as TabKey, label: "Ta'minotchi to'lovlari" }] : []),
  ];

  function openCreate(kind: PaymentKind, supplierId?: string | null) {
    setModalKind(kind);
    setForm({
      supplierId: supplierId ?? suppliers[0]?.id ?? "",
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
        ? (payment.paymentMethod as PaymentMethod)
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
        supplierId: form.supplierId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setErrorMessage(
        data.error ?? `To'lovni saqlashda xatolik. Server status: ${res.status}`
      );
      return;
    }
    setModalKind(null);
    startTransition(() => router.refresh());
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { kind, payment } = deleteTarget;
    const res = await fetch(`/api/orders/${orderId}/${kind}-payments/${payment.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErrorMessage(
        data.error ?? `To'lovni o'chirishda xatolik. Server status: ${res.status}`
      );
      return;
    }
    setDeleteTarget(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col">
      {/* Sticky top bar — negative margins break out of parent p-6 */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-6 py-3">
          <Link
            href={backPath}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <ArrowLeft className="size-4" />
            Orqaga
          </Link>
          <span className="text-gray-200">/</span>
          <span className="text-sm font-semibold text-gray-900">{orderNumber}</span>
          <div className="min-w-0 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <span className={statusTextClass(summary.clientPaymentStatus)}>
              {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
            </span>
            {isAdmin && (
              <>
                <span className="px-1.5 text-gray-300">•</span>
                <span className={statusTextClass(summary.orderFinanceStatus)}>
                  {FINANCE_STATUS_LABELS[summary.orderFinanceStatus]}
                </span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isPending && (
              <span className="text-xs text-gray-400">Yangilanmoqda...</span>
            )}
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="mx-auto w-full max-w-6xl space-y-3 p-6">
        <div className={cn("grid gap-3", isAdmin ? "lg:grid-cols-3" : "max-w-md")}>
          <FinanceBlock
            label="Mijoz"
            status={CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
            total={summary.clientTotal}
            items={[
              { label: "Paid", value: summary.clientPaid, className: summary.clientPaid > 0 ? "text-green-600" : "text-gray-900" },
              {
                label: "Balance",
                value: summary.clientBalance,
                className: valueTone(summary.clientBalance, false),
              },
            ]}
          />

          {isAdmin && (
            <FinanceBlock
              label="Suppliers"
              total={summary.supplierTotal}
              items={[
                { label: "Paid", value: summary.supplierPaid, className: summary.supplierPaid > 0 ? "text-green-600" : "text-gray-900" },
                {
                  label: "Balance",
                  value: summary.supplierBalance,
                  className: valueTone(summary.supplierBalance, false),
                },
              ]}
            />
          )}

          {isAdmin && (
            <FinanceBlock
              label="Profit"
              total={summary.expectedGrossProfit}
              featured
              items={[
                {
                  label: "Cash Difference",
                  value: summary.cashDifference,
                  className: valueTone(summary.cashDifference),
                },
              ]}
            />
          )}
        </div>

        {/* Pill tabs */}
        <div className="inline-flex rounded-full bg-gray-100 p-1 gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "rounded-full bg-gray-950 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "suppliers" && isAdmin && (
          <div className="max-w-5xl overflow-hidden border border-gray-200 bg-white">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">
                    Ta'minotchi
                  </th>
                  <th className="h-9 px-3 text-center text-[11px] font-semibold uppercase text-gray-400">
                    Qismlar
                  </th>
                  <th className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-gray-400">
                    Jami
                  </th>
                  <th className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-gray-400">
                    To'landi
                  </th>
                  <th className="h-9 px-3 text-right text-[11px] font-semibold uppercase text-gray-400">
                    Qoldiq
                  </th>
                  <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">
                    Holat
                  </th>
                  <th className="h-9 px-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.supplierBreakdown.map((row) => {
                  const paid = row.supplierBalance <= 0;
                  return (
                    <tr key={row.supplierId ?? "no-supplier"} className="hover:bg-gray-50/50">
                      <td className="h-10 px-3 font-medium text-gray-900">{row.supplierName}</td>
                      <td className="h-10 px-3 text-center text-gray-500">{row.itemCount}</td>
                      <td className="h-10 px-3 text-right font-medium text-gray-800">
                        {formatCny(row.supplierTotal)}
                      </td>
                      <td className="h-10 px-3 text-right font-semibold text-green-600">
                        {formatCny(row.supplierPaid)}
                      </td>
                      <td
                        className={cn(
                          "h-10 px-3 text-right font-semibold",
                          row.supplierBalance > 0 ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {formatCny(row.supplierBalance)}
                      </td>
                      <td className={cn("h-10 px-3 text-left font-medium", paid ? "text-green-600" : "text-red-600")}>
                        {paid ? "Paid" : "Unpaid"}
                      </td>
                      <td className="h-10 px-3 text-right">
                        {row.supplierId && (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openCreate("supplier", row.supplierId)}>
                            Pay Supplier
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {summary.supplierBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      Buyurtma itemlarida ta'minotchi biriktirilmagan
                    </td>
                  </tr>
                )}
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
            onDelete={(payment) => setDeleteTarget({ kind: "client", payment })}
          />
        )}

        {tab === "supplier" && isAdmin && (
          <PaymentTable
            kind="supplier"
            payments={supplierPayments}
            canCreate={isAdmin && suppliers.length > 0}
            canEdit={isAdmin}
            onCreate={() => openCreate("supplier")}
            onEdit={(payment) => openEdit("supplier", payment)}
            onDelete={(payment) => setDeleteTarget({ kind: "supplier", payment })}
          />
        )}
      </div>

      {/* Payment form modal */}
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
              disabled={!suppliers.length}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, supplierId: e.target.value }))
              }
            >
              {suppliers.length ? (
                suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
            onChange={(e) =>
              setForm((prev) => ({ ...prev, amountCny: e.target.value }))
            }
          />
          <Input
            label="To'lov sanasi"
            type="date"
            value={form.paymentDate}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, paymentDate: e.target.value }))
            }
          />
          <Select
            label="Usul"
            value={form.paymentMethod}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                paymentMethod: e.target.value as PaymentMethod,
              }))
            }
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </option>
            ))}
          </Select>
          <Input
            label="Izoh"
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, note: e.target.value }))
            }
          />
          <div className="flex gap-3 pt-2">
            <Button
              onClick={savePayment}
              disabled={
                saving ||
                !form.amountCny ||
                Number(form.amountCny) <= 0 ||
                (modalKind === "supplier" && !form.supplierId)
              }
            >
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="secondary" onClick={() => setModalKind(null)}>
              Bekor
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <AlertDialog
        open={deleteTarget != null}
        title="To'lovni o'chirish"
        description="Bu to'lov yozuvini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        cancelLabel="Bekor"
        destructive
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <AlertDialog
        open={Boolean(errorMessage)}
        title="Xatolik"
        description={errorMessage}
        confirmLabel="Tushunarli"
        onConfirm={() => setErrorMessage("")}
      />
    </div>
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
  const colSpan = (kind === "supplier" ? 6 : 5) + (canEdit ? 1 : 0);
  return (
    <div className="max-w-4xl overflow-hidden border border-gray-200 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {kind === "supplier" && (
              <th className="h-9 px-3 text-left text-[11px] font-semibold uppercase text-gray-400">
                Ta'minotchi
              </th>
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
                <td className="h-10 px-3 font-medium text-gray-900">
                  {payment.supplier?.name ?? "—"}
                </td>
              )}
              <td className="h-10 px-3 text-gray-600">{formatDate(payment.paymentDate)}</td>
              <td className="h-10 px-3 text-gray-600">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethod] ??
                  payment.paymentMethod}
              </td>
              <td className="h-10 px-3 text-right font-semibold text-green-600">
                {formatCny(String(payment.amountCny))}
              </td>
              <td className="h-10 max-w-[140px] truncate px-3 text-gray-500">
                {payment.note ?? "—"}
              </td>
              <td className="h-10 px-3 text-gray-500">{payment.creator?.name ?? "—"}</td>
              {canEdit && (
                <td className="h-10 px-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      aria-label="Tahrirlash"
                      onClick={() => onEdit(payment)}
                    >
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
        <div className="border-t border-gray-100 px-3 py-2 flex justify-end">
          <Button size="sm" className="h-8" onClick={onCreate}>
            <Plus className="size-4" />
            Add Payment
          </Button>
        </div>
      )}
    </div>
  );
}

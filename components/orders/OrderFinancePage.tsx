"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
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
type TabKey = "summary" | "suppliers" | "client" | "supplier";

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

function statusBadgeClass(status: PaymentStatus | OrderFinanceStatus) {
  if (status === "paid" || status === "closed" || status === "supplier_paid") {
    return "bg-green-100 text-green-700";
  }
  if (status === "overpaid" || status === "ready_to_pay_supplier") {
    return "bg-green-50 text-green-600";
  }
  if (
    status === "partially_paid" ||
    status === "client_partially_paid" ||
    status === "supplier_partially_paid"
  ) {
    return "bg-yellow-100 text-yellow-700";
  }
  return "bg-gray-100 text-gray-600";
}

function toDateInput(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("uz");
}

function FinanceCard({
  label,
  badge,
  total,
  items,
}: {
  label: string;
  badge?: React.ReactNode;
  total: number;
  items: { label: string; value: number; tone?: "red" | "green" | "muted" }[];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
        {badge}
      </div>
      <div className="mb-4 text-3xl font-bold tracking-tight text-gray-900">
        {formatCny(total)}
      </div>
      <div className="space-y-2 border-t border-gray-100 pt-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{item.label}</span>
            <span
              className={cn(
                "text-sm font-semibold",
                item.tone === "red" && "text-red-600",
                item.tone === "green" && "text-green-600",
                item.tone === "muted" && "text-gray-500",
                !item.tone && "text-gray-700"
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
  const [tab, setTab] = useState<TabKey>("summary");
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

  const canCreateClient = isAdmin || canManageClientPayments;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "summary", label: "Xulosa" },
    ...(isAdmin ? [{ key: "suppliers" as TabKey, label: "Ta'minotchilar" }] : []),
    { key: "client", label: "Mijoz to'lovlari" },
    ...(isAdmin ? [{ key: "supplier" as TabKey, label: "Ta'minotchi to'lovlari" }] : []),
  ];

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
      alert(data.error ?? "To'lovni saqlashda xatolik");
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
      alert(data.error ?? "To'lovni o'chirishda xatolik");
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
          <span className="text-sm font-semibold text-gray-900">Order Finance</span>
          <span className="text-sm text-gray-400">{orderNumber}</span>
          <div className="ml-auto flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                statusBadgeClass(summary.clientPaymentStatus)
              )}
            >
              {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
            </span>
            {isAdmin && (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusBadgeClass(summary.orderFinanceStatus)
                )}
              >
                {FINANCE_STATUS_LABELS[summary.orderFinanceStatus]}
              </span>
            )}
            {isPending && (
              <span className="text-xs text-gray-400">Yangilanmoqda...</span>
            )}
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="space-y-5 p-6">
        {/* Financial summary cards */}
        <div className={cn("grid gap-4", isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-1 max-w-sm")}>
          <FinanceCard
            label="Mijoz"
            badge={
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  statusBadgeClass(summary.clientPaymentStatus)
                )}
              >
                {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
              </span>
            }
            total={summary.clientTotal}
            items={[
              { label: "To'landi", value: summary.clientPaid, tone: summary.clientPaid > 0 ? "green" : "muted" },
              {
                label: "Qoldiq",
                value: summary.clientBalance,
                tone: summary.clientBalance > 0 ? "red" : "green",
              },
            ]}
          />

          {isAdmin && (
            <FinanceCard
              label="Ta'minotchi"
              total={summary.supplierTotal}
              items={[
                { label: "To'landi", value: summary.supplierPaid, tone: summary.supplierPaid > 0 ? "green" : "muted" },
                {
                  label: "Qoldiq",
                  value: summary.supplierBalance,
                  tone: summary.supplierBalance > 0 ? "red" : "green",
                },
              ]}
            />
          )}

          {isAdmin && (
            <FinanceCard
              label="Foyda"
              total={summary.expectedGrossProfit}
              items={[
                {
                  label: "Naqd farqi",
                  value: summary.cashDifference,
                  tone: summary.cashDifference >= 0 ? "green" : "red",
                },
              ]}
            />
          )}
        </div>

        {/* Pill tabs */}
        <div className="inline-flex rounded-lg bg-gray-100 p-1 gap-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "summary" && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Mijoz holati
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusBadgeClass(summary.clientPaymentStatus)
                )}
              >
                {CLIENT_STATUS_LABELS[summary.clientPaymentStatus]}
              </span>
            </div>
            {isAdmin && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Finance holati
                </span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    statusBadgeClass(summary.orderFinanceStatus)
                  )}
                >
                  {FINANCE_STATUS_LABELS[summary.orderFinanceStatus]}
                </span>
              </div>
            )}
          </div>
        )}

        {tab === "suppliers" && isAdmin && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                    Ta'minotchi
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">
                    Qismlar
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">
                    Jami
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">
                    To'landi
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">
                    Qoldiq
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">
                    Holat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {summary.supplierBreakdown.map((row) => {
                  const paid = row.supplierBalance <= 0;
                  return (
                    <tr key={row.supplierId ?? "no-supplier"} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-medium text-gray-800">{row.supplierName}</td>
                      <td className="px-4 py-2 text-center text-gray-500">{row.itemCount}</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-800">
                        {formatCny(row.supplierTotal)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">
                        {formatCny(row.supplierPaid)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-2 text-right font-semibold",
                          row.supplierBalance > 0 ? "text-red-600" : "text-green-600"
                        )}
                      >
                        {formatCny(row.supplierBalance)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {paid ? "To'langan" : "To'lanmagan"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {summary.supplierBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                      Ta'minotchi yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {summary.supplierBreakdown.some((r) => r.supplierBalance > 0) && (
              <div className="border-t border-gray-100 px-4 py-3 flex justify-end">
                <Button size="sm" onClick={() => openCreate("supplier")}>
                  <Plus className="size-4" />
                  Ta'minotchiga to'lov
                </Button>
              </div>
            )}
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
            canCreate={isAdmin}
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
              onChange={(e) =>
                setForm((prev) => ({ ...prev, supplierId: e.target.value }))
              }
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
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
              disabled={saving || !form.amountCny || Number(form.amountCny) <= 0}
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
      <Modal
        open={deleteTarget != null}
        onClose={() => setDeleteTarget(null)}
        title="To'lovni o'chirish"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bu to'lov yozuvini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Bekor
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              <Trash2 className="size-4" />
              {deleting ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </div>
        </div>
      </Modal>
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {kind === "supplier" && (
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                Ta'minotchi
              </th>
            )}
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Sana</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Usul</th>
            <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500">Miqdor</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Izoh</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Kiritdi</th>
            {canEdit && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50/50">
              {kind === "supplier" && (
                <td className="px-4 py-2 font-medium text-gray-800">
                  {payment.supplier?.name ?? "—"}
                </td>
              )}
              <td className="px-4 py-2 text-gray-600">{formatDate(payment.paymentDate)}</td>
              <td className="px-4 py-2 text-gray-600">
                {PAYMENT_METHOD_LABELS[payment.paymentMethod as PaymentMethod] ??
                  payment.paymentMethod}
              </td>
              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                {formatCny(String(payment.amountCny))}
              </td>
              <td className="max-w-[160px] truncate px-4 py-2 text-gray-500">
                {payment.note ?? "—"}
              </td>
              <td className="px-4 py-2 text-gray-500">{payment.creator?.name ?? "—"}</td>
              {canEdit && (
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Tahrirlash"
                      onClick={() => onEdit(payment)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      aria-label="O'chirish"
                      onClick={() => onDelete(payment)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={colSpan} className="px-4 py-10 text-center">
                <div className="text-sm text-gray-400">
                  {kind === "client" ? "Mijoz to'lovlari yo'q" : "Ta'minotchi to'lovlari yo'q"}
                </div>
                {canCreate && (
                  <button
                    type="button"
                    onClick={onCreate}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:border-gray-300 hover:text-gray-900"
                  >
                    <Plus className="size-3.5" />
                    To'lov qo'shish
                  </button>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {payments.length > 0 && canCreate && (
        <div className="border-t border-gray-100 px-4 py-3 flex justify-end">
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-4" />
            To'lov qo'shish
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { FinanceSummaryCards } from "@/components/orders/finance/FinanceSummaryCards";
import { PaymentFormModal } from "@/components/orders/finance/PaymentFormModal";
import { PaymentTable } from "@/components/orders/finance/PaymentTable";
import { SupplierBreakdownTable } from "@/components/orders/finance/SupplierBreakdownTable";
import type {
  FinanceTabKey,
  OrderFinancePageProps,
  PaymentForm,
  PaymentKind,
  PaymentRecord,
} from "@/components/orders/types/orderFinanceTypes";
import {
  CLIENT_STATUS_LABELS,
  FINANCE_STATUS_LABELS,
  statusTextClass,
  toDateInput,
} from "@/components/orders/finance/orderFinanceUtils";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/order-finance";
import { cn } from "@/lib/utils";

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
  const [tab, setTab] = useState<FinanceTabKey>(isAdmin ? "suppliers" : "client");
  const [modalKind, setModalKind] = useState<PaymentKind | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: PaymentKind;
    payment: PaymentRecord;
  } | null>(null);
  const [form, setForm] = useState<PaymentForm>(() => buildEmptyForm(suppliers[0]?.id));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const canCreateClient = isAdmin || canManageClientPayments;

  const tabs: { key: FinanceTabKey; label: string }[] = [
    ...(isAdmin ? [{ key: "suppliers" as FinanceTabKey, label: "Ta'minotchilar" }] : []),
    { key: "client", label: "Mijoz to'lovlari" },
    ...(isAdmin ? [{ key: "supplier" as FinanceTabKey, label: "Ta'minotchi to'lovlari" }] : []),
  ];

  function openCreate(kind: PaymentKind, supplierId?: string | null) {
    setModalKind(kind);
    setForm(buildEmptyForm(supplierId ?? suppliers[0]?.id));
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
    const response = await fetch(url, {
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
    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setErrorMessage(data.error ?? `To'lovni saqlashda xatolik. Server status: ${response.status}`);
      return;
    }

    setModalKind(null);
    startTransition(() => router.refresh());
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);
    const { kind, payment } = deleteTarget;
    const response = await fetch(`/api/orders/${orderId}/${kind}-payments/${payment.id}`, {
      method: "DELETE",
    });
    setDeleting(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setErrorMessage(data.error ?? `To'lovni o'chirishda xatolik. Server status: ${response.status}`);
      return;
    }

    setDeleteTarget(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col">
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
            {isPending && <span className="text-xs text-gray-400">Yangilanmoqda...</span>}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-3 p-6">
        <FinanceSummaryCards isAdmin={isAdmin} summary={summary} />

        <div className="inline-flex gap-0.5 rounded-full bg-gray-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === item.key
                  ? "rounded-full bg-gray-950 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "suppliers" && isAdmin && (
          <SupplierBreakdownTable
            rows={summary.supplierBreakdown}
            onPaySupplier={(supplierId) => openCreate("supplier", supplierId)}
          />
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

      <PaymentFormModal
        open={modalKind != null}
        kind={modalKind}
        form={form}
        suppliers={suppliers}
        saving={saving}
        onClose={() => setModalKind(null)}
        onSave={savePayment}
        onFormChange={setForm}
      />

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

function buildEmptyForm(supplierId = ""): PaymentForm {
  return {
    supplierId,
    amountCny: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    note: "",
  };
}

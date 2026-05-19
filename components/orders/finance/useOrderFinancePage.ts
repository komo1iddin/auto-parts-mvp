"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PAYMENT_METHODS,
  type OrderFinanceSummary,
  type PaymentMethod,
} from "@/lib/order-finance";
import type {
  PaymentForm,
  PaymentKind,
  PaymentRecord,
  SupplierOption,
} from "@/components/orders/types/orderFinanceTypes";
import { toDateInput } from "@/components/orders/finance/orderFinanceUtils";

interface UseOrderFinancePageArgs {
  orderId: string;
  isAdmin: boolean;
  canManageClientPayments: boolean;
  suppliers: SupplierOption[];
  summary: OrderFinanceSummary;
}

export function useOrderFinancePage({
  orderId,
  isAdmin,
  canManageClientPayments,
  suppliers,
  summary,
}: UseOrderFinancePageArgs) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
  const availableSupplierCash = Math.max(0, summary.cashDifference);
  const availableProfit = Math.max(0, Math.min(summary.cashDifference, summary.profitBalance));
  const canCreateSupplier = isAdmin && suppliers.length > 0 && availableSupplierCash > 0;
  const canCreateProfit = isAdmin && availableProfit > 0;
  const canCreateTransaction = canCreateClient || canCreateSupplier || canCreateProfit;

  function openCreate(kind: PaymentKind, supplierId?: string | null, amountCny?: number) {
    setModalKind(kind);
    const supplierDebt =
      kind === "supplier"
        ? summary.supplierBreakdown.find((supplier) => supplier.supplierId === (supplierId ?? suppliers[0]?.id))?.supplierBalance ?? 0
        : 0;
    const suggestedSupplierPayment = Math.max(0, Math.min(supplierDebt || availableSupplierCash, availableSupplierCash));
    setForm({
      ...buildEmptyForm(supplierId ?? suppliers[0]?.id),
      amountCny: amountCny != null
        ? String(amountCny)
        : kind === "supplier" && suggestedSupplierPayment > 0
          ? String(suggestedSupplierPayment)
          : kind === "profit" && availableProfit > 0
            ? String(availableProfit)
            : "",
    });
  }

  function openTransaction() {
    openCreate(canCreateClient ? "client" : "supplier");
  }

  function switchCreateKind(kind: PaymentKind) {
    if (form.id) return;
    setModalKind(kind);
    setForm((current) => ({
      ...current,
      amountCny: kind === "supplier" ? current.amountCny : current.amountCny,
      supplierId: kind === "supplier" ? current.supplierId || suppliers[0]?.id || "" : current.supplierId,
    }));
  }

  function openEdit(kind: PaymentKind, payment: PaymentRecord) {
    const amount = Number(payment.amountCny);
    const modalPaymentKind = kind === "client" && amount < 0 ? "refund" : kind;
    setModalKind(modalPaymentKind);
    setForm({
      id: payment.id,
      supplierId: payment.supplierId ?? suppliers[0]?.id ?? "",
      amountCny: String(Math.abs(amount)),
      paymentDate: toDateInput(payment.paymentDate),
      paymentMethod: PAYMENT_METHODS.includes(payment.paymentMethod as PaymentMethod)
        ? (payment.paymentMethod as PaymentMethod)
        : "other",
      note: payment.note ?? "",
    });
  }

  async function savePayment() {
    if (!modalKind) return;
    if (modalKind === "supplier" && Number(form.amountCny) > availableSupplierCash) {
      setErrorMessage(`Ta'minotchi to'lovi mijozdan kelgan mavjud puldan oshmasligi kerak. Mavjud: ${availableSupplierCash}`);
      return;
    }
    if (modalKind === "profit" && Number(form.amountCny) > availableProfit) {
      setErrorMessage(`Olish mumkin bo'lgan foyda yetarli emas. Mavjud: ${availableProfit}`);
      return;
    }

    setSaving(true);
    const apiKind = modalKind === "refund" ? "client-payments" : modalKind === "profit" ? "profit-withdrawals" : `${modalKind}-payments`;
    const signedAmount = modalKind === "refund" ? -Math.abs(Number(form.amountCny)) : Number(form.amountCny);
    const base = `/api/orders/${orderId}/${apiKind}`;
    const url = form.id ? `${base}/${form.id}` : base;
    const response = await fetch(url, {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountCny: signedAmount,
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
    const apiKind = kind === "profit" ? "profit-withdrawals" : `${kind}-payments`;
    const response = await fetch(`/api/orders/${orderId}/${apiKind}/${payment.id}`, {
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

  return {
    isPending,
    modalKind,
    setModalKind,
    deleteTarget,
    setDeleteTarget,
    form,
    setForm,
    saving,
    deleting,
    errorMessage,
    setErrorMessage,
    canCreateClient,
    canCreateSupplier,
    canCreateProfit,
    canCreateTransaction,
    availableSupplierCash,
    availableProfit,
    openCreate,
    openTransaction,
    switchCreateKind,
    openEdit,
    savePayment,
    confirmDelete,
  };
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

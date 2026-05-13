"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/order-finance";
import type {
  FinanceTabKey,
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
}

export function useOrderFinancePage({
  orderId,
  isAdmin,
  canManageClientPayments,
  suppliers,
}: UseOrderFinancePageArgs) {
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

  return {
    isPending,
    tab,
    setTab,
    tabs,
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
    openCreate,
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

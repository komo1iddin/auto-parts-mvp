"use client";

import { AlertDialog } from "@/components/ui/AlertDialog";
import { FinancePageHeader } from "@/components/orders/finance/FinancePageHeader";
import { FinanceSummaryCards } from "@/components/orders/finance/FinanceSummaryCards";
import { FinanceTabs } from "@/components/orders/finance/FinanceTabs";
import { PaymentFormModal } from "@/components/orders/finance/PaymentFormModal";
import { PaymentTable } from "@/components/orders/finance/PaymentTable";
import { SupplierBreakdownTable } from "@/components/orders/finance/SupplierBreakdownTable";
import { useOrderFinancePage } from "@/components/orders/finance/useOrderFinancePage";
import type { OrderFinancePageProps } from "@/components/orders/types/orderFinanceTypes";

export function OrderFinancePage(props: OrderFinancePageProps) {
  const {
    orderId,
    orderNumber,
    backPath,
    isAdmin,
    canManageClientPayments,
    summary,
    clientPayments,
    supplierPayments,
    suppliers,
  } = props;
  const finance = useOrderFinancePage({
    orderId,
    isAdmin,
    canManageClientPayments,
    suppliers,
  });

  return (
    <div className="flex flex-col">
      <FinancePageHeader
        orderNumber={orderNumber}
        backPath={backPath}
        isAdmin={isAdmin}
        summary={summary}
        isPending={finance.isPending}
      />

      <div className="mx-auto w-full max-w-6xl space-y-3 p-6">
        <FinanceSummaryCards isAdmin={isAdmin} summary={summary} />
        <FinanceTabs tabs={finance.tabs} activeTab={finance.tab} onChange={finance.setTab} />

        {finance.tab === "suppliers" && isAdmin && (
          <SupplierBreakdownTable
            rows={summary.supplierBreakdown}
            onPaySupplier={(supplierId) => finance.openCreate("supplier", supplierId)}
          />
        )}

        {finance.tab === "client" && (
          <PaymentTable
            kind="client"
            payments={clientPayments}
            canCreate={finance.canCreateClient}
            canEdit={isAdmin}
            onCreate={() => finance.openCreate("client")}
            onEdit={(payment) => finance.openEdit("client", payment)}
            onDelete={(payment) => finance.setDeleteTarget({ kind: "client", payment })}
          />
        )}

        {finance.tab === "supplier" && isAdmin && (
          <PaymentTable
            kind="supplier"
            payments={supplierPayments}
            canCreate={isAdmin && suppliers.length > 0}
            canEdit={isAdmin}
            onCreate={() => finance.openCreate("supplier")}
            onEdit={(payment) => finance.openEdit("supplier", payment)}
            onDelete={(payment) => finance.setDeleteTarget({ kind: "supplier", payment })}
          />
        )}
      </div>

      <PaymentFormModal
        open={finance.modalKind != null}
        kind={finance.modalKind}
        form={finance.form}
        suppliers={suppliers}
        saving={finance.saving}
        onClose={() => finance.setModalKind(null)}
        onSave={finance.savePayment}
        onFormChange={finance.setForm}
      />

      <AlertDialog
        open={finance.deleteTarget != null}
        title="To'lovni o'chirish"
        description="Bu to'lov yozuvini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi."
        confirmLabel="O'chirish"
        cancelLabel="Bekor"
        destructive
        loading={finance.deleting}
        onCancel={() => finance.setDeleteTarget(null)}
        onConfirm={finance.confirmDelete}
      />

      <AlertDialog
        open={Boolean(finance.errorMessage)}
        title="Xatolik"
        description={finance.errorMessage}
        confirmLabel="Tushunarli"
        onConfirm={() => finance.setErrorMessage("")}
      />
    </div>
  );
}

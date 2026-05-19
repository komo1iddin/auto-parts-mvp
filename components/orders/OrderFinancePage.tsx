"use client";

import { AlertDialog } from "@/components/ui/AlertDialog";
import { FinancePageHeader } from "@/components/orders/finance/FinancePageHeader";
import { FinanceSummaryCards } from "@/components/orders/finance/FinanceSummaryCards";
import { PaymentFormModal } from "@/components/orders/finance/PaymentFormModal";
import { SupplierSettlementCards } from "@/components/orders/finance/SupplierSettlementCards";
import { TransactionFeed } from "@/components/orders/finance/TransactionFeed";
import { useOrderFinancePage } from "@/components/orders/finance/useOrderFinancePage";
import type { OrderFinancePageProps } from "@/components/orders/types/orderFinanceTypes";

export function OrderFinancePage(props: OrderFinancePageProps) {
  const {
    orderId,
    orderNumber,
    backPath,
    isAdmin,
    canManageClientPayments,
    embedded = false,
    summary,
    clientPayments,
    supplierPayments,
    profitWithdrawals,
    suppliers,
  } = props;
  const finance = useOrderFinancePage({
    orderId,
    isAdmin,
    canManageClientPayments,
    suppliers,
    summary,
  });

  return (
    <div className="flex flex-col">
      {!embedded && (
        <FinancePageHeader
          orderNumber={orderNumber}
          backPath={backPath}
          isAdmin={isAdmin}
          summary={summary}
          isPending={finance.isPending}
        />
      )}

      <div className="mx-auto grid w-full max-w-7xl gap-4 p-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:p-5">
        <FinanceSummaryCards isAdmin={isAdmin} summary={summary} />
        <div className="space-y-4">
          <TransactionFeed
            clientPayments={clientPayments}
            supplierPayments={isAdmin ? supplierPayments : []}
            profitWithdrawals={isAdmin ? profitWithdrawals : []}
            canCreate={finance.canCreateTransaction}
            canEdit={isAdmin}
            onCreate={finance.openTransaction}
            onEdit={finance.openEdit}
            onDelete={(kind, payment) => finance.setDeleteTarget({ kind, payment })}
          />

          {isAdmin && (
            <SupplierSettlementCards
              rows={summary.supplierBreakdown}
              onPaySupplier={(supplierId) => finance.openCreate("supplier", supplierId)}
            />
          )}
        </div>
      </div>

      <PaymentFormModal
        open={finance.modalKind != null}
        kind={finance.modalKind}
        form={finance.form}
        suppliers={suppliers}
        supplierBreakdown={summary.supplierBreakdown}
        saving={finance.saving}
        canChooseClient={finance.canCreateClient}
        canChooseSupplier={finance.canCreateSupplier}
        canChooseProfit={finance.canCreateProfit}
        availableSupplierCash={finance.availableSupplierCash}
        availableProfit={finance.availableProfit}
        onClose={() => finance.setModalKind(null)}
        onSave={finance.savePayment}
        onFormChange={finance.setForm}
        onKindChange={finance.switchCreateKind}
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

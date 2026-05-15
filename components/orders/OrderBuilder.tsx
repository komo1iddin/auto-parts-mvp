"use client";

import { OrderBuilderBar } from "@/components/orders/builder/OrderBuilderBar";
import { OrderExcelImport } from "@/components/orders/builder/OrderExcelImport";
import { OrderBuilderModals } from "@/components/orders/builder/OrderBuilderModals";
import { OrderBuilderOptions } from "@/components/orders/builder/OrderBuilderOptions";
import { OrderItemsTable } from "@/components/orders/builder/OrderItemsTable";
import { OrderPartSearch } from "@/components/orders/builder/OrderPartSearch";
import { useOrderBuilder } from "@/components/orders/builder/useOrderBuilder";
import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";

interface OrderBuilderProps {
  isAdmin: boolean;
  existingOrder?: {
    id: string;
    items: OrderItem[];
    status: string;
    customerId?: string | null;
  };
  redirectTo: string;
  ordersPath?: string;
}

export function OrderBuilder({ isAdmin, existingOrder, redirectTo, ordersPath = redirectTo }: OrderBuilderProps) {
  const builder = useOrderBuilder({ existingOrder, redirectTo, ordersPath });

  return (
    <div className="space-y-6">
      <OrderExcelImport onImportItems={builder.addImportedItems} />

      <OrderPartSearch
        query={builder.q}
        searching={builder.searching}
        results={builder.searchResults}
        items={builder.items}
        onQueryChange={builder.setQ}
        onAddPart={builder.addPart}
      />

      <OrderItemsTable
        items={builder.items}
        isAdmin={isAdmin}
        suppliers={builder.suppliers}
        partQualityTypes={builder.partQualityTypes}
        duplicateCodes={builder.duplicateCodes}
        updateField={builder.updateField}
        updateQty={builder.updateQty}
        onDelete={builder.setDeleteTarget}
      />

      <OrderBuilderOptions
        customers={builder.customers}
        customerId={builder.customerId}
        status={builder.status}
        changeNote={builder.changeNote}
        changelogPreview={builder.changelogPreview}
        isEdit={Boolean(existingOrder)}
        onCustomerChange={builder.setCustomerId}
        onStatusChange={builder.setStatus}
        onChangeNoteChange={builder.setChangeNote}
      />

      {builder.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {builder.error}
        </p>
      )}

      <div className="h-20" />

      <OrderBuilderBar
        itemCount={builder.items.length}
        totalQty={builder.totals.totalQty}
        totalPurchase={builder.totals.totalPurchase}
        totalSelling={builder.totals.totalSelling}
        isAdmin={isAdmin}
        undoState={builder.undoState}
        onUndo={builder.undoDelete}
        onDismissUndo={() => builder.setUndoState(null)}
        saving={builder.saving}
        isEdit={Boolean(existingOrder)}
        onCancel={() => builder.requestNavigation({ type: "href", href: redirectTo })}
        onBackToOrders={() => builder.requestNavigation({ type: "href", href: ordersPath })}
        onSave={() => void builder.save()}
      />

      <OrderBuilderModals
        deleteTarget={builder.deleteTarget}
        leavePromptOpen={builder.leavePromptOpen}
        pendingNavigation={builder.pendingNavigation}
        error={builder.error}
        saving={builder.saving}
        canSave={builder.items.length > 0}
        onCloseDelete={() => builder.setDeleteTarget(null)}
        onConfirmDelete={builder.removeItem}
        onCloseLeavePrompt={builder.closeLeavePrompt}
        onLeaveAnyway={builder.leaveAnyway}
        onSaveAndLeave={builder.saveAndLeave}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  OrderItem,
  PendingNavigation,
} from "@/components/orders/types/orderBuilderTypes";
import {
  buildOrderChangelog,
  getDuplicateCodes,
  getOrderTotals,
  serializeItems,
} from "@/components/orders/builder/utils/orderBuilderUtils";
import { useOrderItems } from "@/components/orders/builder/hooks/useOrderItems";
import { usePartSearch } from "@/components/orders/builder/hooks/usePartSearch";
import { useUnsavedOrderNavigation } from "@/components/orders/builder/hooks/useUnsavedOrderNavigation";
import { useRefreshOrderParts } from "@/components/orders/builder/hooks/useRefreshOrderParts";
import { markLocalMutation } from "@/lib/client/local-mutation";

interface UseOrderBuilderArgs {
  existingOrder?: {
    id: string;
    items: OrderItem[];
    status: string;
    customerId?: string | null;
  };
  redirectTo: string;
  ordersPath?: string;
}

export function useOrderBuilder({ existingOrder, redirectTo, ordersPath }: UseOrderBuilderArgs) {
  const router = useRouter();
  const [isNavigatingAfterSave, startSaveNavigation] = useTransition();
  const search = usePartSearch();
  const orderItems = useOrderItems(existingOrder?.items ?? []);
  const [customerId, setCustomerId] = useState(existingOrder?.customerId ?? "");
  const [status, setStatus] = useState(existingOrder?.status ?? "draft");
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [originalItems] = useState<OrderItem[]>(() => existingOrder?.items ?? []);
  const refresh = useRefreshOrderParts(existingOrder?.id ?? "", orderItems.items);
  const [originalCustomerId] = useState(existingOrder?.customerId ?? "");
  const [originalStatus] = useState(existingOrder?.status ?? "draft");
  const changelogPreview = useMemo(
    () => buildOrderChangelog(originalItems, orderItems.items),
    [orderItems.items, originalItems]
  );
  const isDirty = useMemo(() => (
    serializeItems(orderItems.items) !== serializeItems(originalItems) ||
    customerId !== originalCustomerId ||
    status !== originalStatus ||
    changeNote.trim().length > 0
  ), [changeNote, customerId, orderItems.items, originalCustomerId, originalItems, originalStatus, status]);
  const navigation = useUnsavedOrderNavigation({
    enabled: Boolean(existingOrder),
    isDirty,
  });

  useEffect(() => {
    router.prefetch(redirectTo);
    if (ordersPath && ordersPath !== redirectTo) router.prefetch(ordersPath);
  }, [ordersPath, redirectTo, router]);

  function addPartAndClearSearch(part: Parameters<typeof orderItems.addPart>[0]) {
    orderItems.addPart(part);
    search.setQ("");
    search.setSearchResults([]);
  }

  async function save(destination?: PendingNavigation) {
    if (!orderItems.items.length) {
      setError("Kamida bitta qism kerak");
      return;
    }
    if (!customerId) {
      setError("Mijoz tanlash majburiy");
      return;
    }

    setSaving(true);
    setError("");
    const finalNote = existingOrder ? (changeNote.trim() || changelogPreview) : changeNote;
    markLocalMutation();
    const response = await fetch(existingOrder ? `/api/orders/${existingOrder.id}` : "/api/orders", {
      method: existingOrder ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, items: orderItems.items, status, changeNote: finalNote }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      setSaving(false);
      return;
    }

    navigation.markSaved();
    markLocalMutation();
    startSaveNavigation(() => {
      if (destination?.type === "href") router.push(destination.href);
      else if (destination?.type === "back") window.history.go(destination.delta ?? -1);
      else router.push(redirectTo);
    });
  }

  function saveAndLeave() {
    if (!navigation.pendingNavigation) return;
    void save(navigation.pendingNavigation);
  }

  async function refreshParts() {
    const result = await refresh.refresh();
    if (result) {
      orderItems.applyRefreshUpdates(result.autoApplied);
    }
  }

  function applyRefreshConflicts(choices: Record<string, "accept" | "keep">) {
    const updates = refresh.buildUpdatesFromChoices(choices);
    orderItems.applyRefreshUpdates(updates);
    refresh.closeConflicts();
  }

  return {
    q: search.q,
    setQ: search.setQ,
    searchResults: search.searchResults,
    searching: search.searching,
    suppliers: search.suppliers,
    customers: search.customers,
    partQualityTypes: search.partQualityTypes,
    customerId,
    setCustomerId,
    items: orderItems.items,
    deleteTarget: orderItems.deleteTarget,
    setDeleteTarget: orderItems.setDeleteTarget,
    undoState: orderItems.undoState,
    setUndoState: orderItems.setUndoState,
    addPart: addPartAndClearSearch,
    addImportedItems: orderItems.addImportedItems,
    updateQty: orderItems.updateQty,
    updateField: orderItems.updateField,
    updateAllSuppliers: orderItems.updateAllSuppliers,
    removeItem: orderItems.removeItem,
    undoDelete: orderItems.undoDelete,
    status,
    setStatus,
    changeNote,
    setChangeNote,
    saving: saving || isNavigatingAfterSave || navigation.isNavigating,
    error,
    leavePromptOpen: navigation.leavePromptOpen,
    pendingNavigation: navigation.pendingNavigation,
    requestNavigation: navigation.requestNavigation,
    closeLeavePrompt: navigation.closeLeavePrompt,
    leaveAnyway: navigation.leaveAnyway,
    changelogPreview,
    duplicateCodes: getDuplicateCodes(orderItems.items),
    totals: getOrderTotals(orderItems.items),
    save,
    saveAndLeave,
    refreshing: refresh.refreshing,
    refreshConflictState: refresh.conflictState,
    refreshParts,
    applyRefreshConflicts,
    cancelRefreshConflicts: refresh.closeConflicts,
  };
}

"use client";

import { useMemo, useState } from "react";
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
} from "@/components/orders/builder/orderBuilderUtils";
import { useOrderItems } from "@/components/orders/builder/useOrderItems";
import { usePartSearch } from "@/components/orders/builder/usePartSearch";
import { useUnsavedOrderNavigation } from "@/components/orders/builder/useUnsavedOrderNavigation";

interface UseOrderBuilderArgs {
  existingOrder?: {
    id: string;
    items: OrderItem[];
    status: string;
  };
  redirectTo: string;
}

export function useOrderBuilder({ existingOrder, redirectTo }: UseOrderBuilderArgs) {
  const router = useRouter();
  const search = usePartSearch();
  const orderItems = useOrderItems(existingOrder?.items ?? []);
  const [status, setStatus] = useState(existingOrder?.status ?? "draft");
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [originalItems] = useState<OrderItem[]>(() => existingOrder?.items ?? []);
  const [originalStatus] = useState(existingOrder?.status ?? "draft");
  const changelogPreview = useMemo(
    () => buildOrderChangelog(originalItems, orderItems.items),
    [orderItems.items, originalItems]
  );
  const isDirty = useMemo(() => (
    serializeItems(orderItems.items) !== serializeItems(originalItems) ||
    status !== originalStatus ||
    changeNote.trim().length > 0
  ), [changeNote, orderItems.items, originalItems, originalStatus, status]);
  const navigation = useUnsavedOrderNavigation({
    enabled: Boolean(existingOrder),
    isDirty,
  });

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

    setSaving(true);
    setError("");
    const finalNote = existingOrder ? (changeNote.trim() || changelogPreview) : changeNote;
    const response = await fetch(existingOrder ? `/api/orders/${existingOrder.id}` : "/api/orders", {
      method: existingOrder ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: orderItems.items, status, changeNote: finalNote }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      setSaving(false);
      return;
    }

    navigation.markSaved();
    if (destination?.type === "href") router.push(destination.href);
    else if (destination?.type === "back") window.history.back();
    else router.push(redirectTo);
    router.refresh();
  }

  function saveAndLeave() {
    if (!navigation.pendingNavigation) return;
    void save(navigation.pendingNavigation);
  }

  return {
    q: search.q,
    setQ: search.setQ,
    searchResults: search.searchResults,
    searching: search.searching,
    suppliers: search.suppliers,
    items: orderItems.items,
    deleteTarget: orderItems.deleteTarget,
    setDeleteTarget: orderItems.setDeleteTarget,
    undoState: orderItems.undoState,
    setUndoState: orderItems.setUndoState,
    addPart: addPartAndClearSearch,
    updateQty: orderItems.updateQty,
    updateField: orderItems.updateField,
    removeItem: orderItems.removeItem,
    undoDelete: orderItems.undoDelete,
    status,
    setStatus,
    changeNote,
    setChangeNote,
    saving,
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
  };
}

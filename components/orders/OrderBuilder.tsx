"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderBuilderBar } from "@/components/orders/OrderBuilderBar";
import { OrderBuilderModals } from "@/components/orders/OrderBuilderModals";
import { OrderBuilderOptions } from "@/components/orders/OrderBuilderOptions";
import { OrderItemsTable } from "@/components/orders/OrderItemsTable";
import { OrderPartSearch } from "@/components/orders/OrderPartSearch";
import type {
  OrderItem,
  PartSearchResult,
  PendingNavigation,
  Supplier,
} from "@/components/orders/orderBuilderTypes";
import {
  buildOrderChangelog,
  serializeItems,
} from "@/components/orders/orderBuilderUtils";

interface OrderBuilderProps {
  isAdmin: boolean;
  existingOrder?: {
    id: string;
    items: OrderItem[];
    status: string;
  };
  redirectTo: string;
  ordersPath?: string;
}

export function OrderBuilder({ isAdmin, existingOrder, redirectTo, ordersPath = redirectTo }: OrderBuilderProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<PartSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<OrderItem[]>(existingOrder?.items ?? []);
  const [status, setStatus] = useState(existingOrder?.status ?? "draft");
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OrderItem | null>(null);
  const [undoState, setUndoState] = useState<{ item: OrderItem; index: number } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [leavePromptOpen, setLeavePromptOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);
  const [originalItems] = useState<OrderItem[]>(() => existingOrder?.items ?? []);
  const [originalStatus] = useState(existingOrder?.status ?? "draft");
  const savedNavigation = useRef(false);
  const isDirtyRef = useRef(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const changelogPreview = useMemo(
    () => buildOrderChangelog(originalItems, items),
    [items, originalItems]
  );
  const isDirty = useMemo(() => {
    return (
      serializeItems(items) !== serializeItems(originalItems) ||
      status !== originalStatus ||
      changeNote.trim().length > 0
    );
  }, [changeNote, items, originalItems, originalStatus, status]);
  const duplicateCodes = useMemo(() => {
    return new Set(
      items
        .map((item) => item.partCode)
        .filter((code, _, allCodes) => allCodes.filter((itemCode) => itemCode === code).length > 1)
    );
  }, [items]);
  const totalSelling = items.reduce((sum, item) => sum + (item.sellingPriceCny ?? 0) * item.quantity, 0);
  const totalPurchase = items.reduce((sum, item) => sum + (item.purchasePriceCny ?? 0) * item.quantity, 0);
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((response) => response.json())
      .then((data) => setSuppliers(data.suppliers ?? []));
  }, []);

  useEffect(() => {
    if (!undoState) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);

    undoTimer.current = setTimeout(() => setUndoState(null), 6000);
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, [undoState]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const response = await fetch(`/api/parts?q=${encodeURIComponent(query)}&take=20`);
    const data = await response.json();
    setSearchResults(data.parts ?? []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(q), 300);
    return () => clearTimeout(timeout);
  }, [q, search]);

  const requestNavigation = useCallback((next: PendingNavigation) => {
    if (!existingOrder || !isDirtyRef.current || savedNavigation.current) {
      if (next.type === "href") router.push(next.href);
      else window.history.back();
      return;
    }

    setPendingNavigation(next);
    setLeavePromptOpen(true);
  }, [existingOrder, router]);

  useEffect(() => {
    if (!existingOrder) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current || savedNavigation.current) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const documentClick = (event: MouseEvent) => {
      if (!isDirtyRef.current || savedNavigation.current || event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;

      const url = new URL(target.href, window.location.href);
      if (url.origin !== window.location.origin || url.href === window.location.href) return;

      event.preventDefault();
      event.stopPropagation();
      requestNavigation({ type: "href", href: `${url.pathname}${url.search}${url.hash}` });
    };

    const popState = () => {
      if (!isDirtyRef.current || savedNavigation.current) return;
      window.history.pushState(null, "", window.location.href);
      requestNavigation({ type: "back" });
    };

    window.history.replaceState(window.history.state, "", window.location.href);
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("popstate", popState);
    document.addEventListener("click", documentClick, true);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", popState);
      document.removeEventListener("click", documentClick, true);
    };
  }, [existingOrder, requestNavigation]);

  function addPart(part: PartSearchResult) {
    const exists = items.find((item) => item.partId === part.id);
    if (exists) {
      setItems((current) => current.map((item) => (
        item.partId === part.id ? { ...item, quantity: item.quantity + 1 } : item
      )));
    } else {
      setItems((current) => [
        ...current,
        {
          partId: part.id,
          partCode: part.code,
          partName: part.name ?? "",
          categoryName: part.category?.name ?? "",
          brand: part.brand ?? "",
          type: part.type,
          sellingPriceCny: part.sellingPriceCny ? Number(part.sellingPriceCny) : null,
          purchasePriceCny: part.purchasePriceCny ? Number(part.purchasePriceCny) : null,
          wholesalePriceCny: part.wholesalePriceCny ? Number(part.wholesalePriceCny) : null,
          supplierId: part.supplier?.id ?? "",
          supplierName: part.supplier?.name ?? "",
          quantity: 1,
          note: "",
        },
      ]);
    }

    setQ("");
    setSearchResults([]);
  }

  function updateQty(partId: string, qty: number) {
    const safe = Math.max(0, Math.floor(qty));
    setItems((current) => current.map((item) => (
      item.partId === partId ? { ...item, quantity: safe } : item
    )));
  }

  function updateField<K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) {
    setItems((current) => current.map((item) => (
      item.partId === partId ? { ...item, [field]: value } : item
    )));
  }

  function removeItem(partId: string) {
    const index = items.findIndex((item) => item.partId === partId);
    const item = items[index];
    setItems((current) => current.filter((currentItem) => currentItem.partId !== partId));
    setDeleteTarget(null);
    if (item) setUndoState({ item, index });
  }

  function undoDelete() {
    if (!undoState) return;
    setItems((current) => {
      const next = [...current];
      next.splice(undoState.index, 0, undoState.item);
      return next;
    });
    setUndoState(null);
  }

  function closeLeavePrompt() {
    setLeavePromptOpen(false);
    setPendingNavigation(null);
  }

  function leaveAnyway() {
    if (!pendingNavigation) return;
    savedNavigation.current = true;
    setLeavePromptOpen(false);
    if (pendingNavigation.type === "href") router.push(pendingNavigation.href);
    else window.history.back();
  }

  async function save(destination?: PendingNavigation) {
    if (!items.length) {
      setError("Kamida bitta qism kerak");
      return;
    }

    setSaving(true);
    setError("");
    const finalNote = existingOrder ? (changeNote.trim() || changelogPreview) : changeNote;
    const url = existingOrder ? `/api/orders/${existingOrder.id}` : "/api/orders";
    const method = existingOrder ? "PUT" : "POST";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, status, changeNote: finalNote }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      setSaving(false);
      return;
    }

    savedNavigation.current = true;
    if (destination?.type === "href") router.push(destination.href);
    else if (destination?.type === "back") window.history.back();
    else router.push(redirectTo);
    router.refresh();
  }

  function saveAndLeave() {
    if (!pendingNavigation) return;
    void save(pendingNavigation);
  }

  return (
    <div className="space-y-6">
      <OrderPartSearch
        query={q}
        searching={searching}
        results={searchResults}
        items={items}
        onQueryChange={setQ}
        onAddPart={addPart}
      />

      <OrderItemsTable
        items={items}
        isAdmin={isAdmin}
        suppliers={suppliers}
        duplicateCodes={duplicateCodes}
        updateField={updateField}
        updateQty={updateQty}
        onDelete={setDeleteTarget}
      />

      <OrderBuilderOptions
        status={status}
        changeNote={changeNote}
        changelogPreview={changelogPreview}
        isEdit={Boolean(existingOrder)}
        onStatusChange={setStatus}
        onChangeNoteChange={setChangeNote}
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="h-20" />

      <OrderBuilderBar
        itemCount={items.length}
        totalQty={totalQty}
        totalPurchase={totalPurchase}
        totalSelling={totalSelling}
        isAdmin={isAdmin}
        undoState={undoState}
        onUndo={undoDelete}
        onDismissUndo={() => setUndoState(null)}
        saving={saving}
        isEdit={Boolean(existingOrder)}
        onCancel={() => requestNavigation({ type: "href", href: redirectTo })}
        onBackToOrders={() => requestNavigation({ type: "href", href: ordersPath })}
        onSave={() => void save()}
      />

      <OrderBuilderModals
        deleteTarget={deleteTarget}
        leavePromptOpen={leavePromptOpen}
        pendingNavigation={pendingNavigation}
        error={error}
        saving={saving}
        canSave={items.length > 0}
        onCloseDelete={() => setDeleteTarget(null)}
        onConfirmDelete={removeItem}
        onCloseLeavePrompt={closeLeavePrompt}
        onLeaveAnyway={leaveAnyway}
        onSaveAndLeave={saveAndLeave}
      />
    </div>
  );
}

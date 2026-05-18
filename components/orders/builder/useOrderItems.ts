"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderItem, PartSearchResult } from "@/components/orders/types/orderBuilderTypes";
import { buildOrderItem } from "@/components/orders/builder/orderBuilderUtils";

function itemKey(item: OrderItem) {
  return item.id ?? item.partVariantId ?? item.partId ?? item.localId ?? item.partCode;
}

function sameCatalogItem(a: OrderItem, b: OrderItem) {
  return (
    a.partCode.trim().toLowerCase() === b.partCode.trim().toLowerCase() &&
    a.type.trim().toLowerCase() === b.type.trim().toLowerCase() &&
    a.brand.trim().toLowerCase() === b.brand.trim().toLowerCase() &&
    a.purchasePriceCny === b.purchasePriceCny &&
    a.sellingPriceCny === b.sellingPriceCny
  );
}

export function useOrderItems(initialItems: OrderItem[]) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<OrderItem | null>(null);
  const [undoState, setUndoState] = useState<{ item: OrderItem; index: number } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!undoState) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);

    undoTimer.current = setTimeout(() => setUndoState(null), 6000);
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, [undoState]);

  function addPart(part: PartSearchResult) {
    const exists = items.find((item) => item.partVariantId === part.id);
    if (exists) {
      setItems((current) => current.map((item) => (
        item.partVariantId === part.id ? { ...item, quantity: item.quantity + 1 } : item
      )));
    } else {
      setItems((current) => [...current, buildOrderItem(part)]);
    }
  }

  function addImportedItems(importedItems: OrderItem[]) {
    setItems((current) => {
      const next = [...current];

      for (const importedItem of importedItems) {
        const existingIndex = next.findIndex((item) => sameCatalogItem(item, importedItem));
        if (existingIndex >= 0) {
          const existing = next[existingIndex];
          next[existingIndex] = {
            ...existing,
            ...importedItem,
            id: existing.id,
            localId: existing.localId,
            quantity: existing.quantity + importedItem.quantity,
            note: [existing.note, importedItem.note].filter(Boolean).join("; "),
          };
        } else {
          next.push(importedItem);
        }
      }

      return next;
    });
  }

  function updateQty(partId: string, qty: number) {
    const safe = Math.max(0, Math.floor(qty));
    setItems((current) => current.map((item) => (
      itemKey(item) === partId ? { ...item, quantity: safe } : item
    )));
  }

  function updateField<K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) {
    setItems((current) => current.map((item) => (
      itemKey(item) === partId ? { ...item, [field]: value } : item
    )));
  }

  function updateAllSuppliers(supplierId: string, supplierName: string) {
    setItems((current) => current.map((item) => ({
      ...item,
      supplierId,
      supplierName,
    })));
  }

  function removeItem(partId: string) {
    const index = items.findIndex((item) => itemKey(item) === partId);
    const item = items[index];
    setItems((current) => current.filter((currentItem) => itemKey(currentItem) !== partId));
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

  return {
    items,
    deleteTarget,
    setDeleteTarget,
    undoState,
    setUndoState,
    addPart,
    addImportedItems,
    updateQty,
    updateField,
    updateAllSuppliers,
    removeItem,
    undoDelete,
  };
}

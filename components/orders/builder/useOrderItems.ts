"use client";

import { useEffect, useRef, useState } from "react";
import type { OrderItem, PartSearchResult } from "@/components/orders/types/orderBuilderTypes";
import { buildOrderItem } from "@/components/orders/builder/orderBuilderUtils";

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
    const exists = items.find((item) => item.partId === part.id);
    if (exists) {
      setItems((current) => current.map((item) => (
        item.partId === part.id ? { ...item, quantity: item.quantity + 1 } : item
      )));
    } else {
      setItems((current) => [...current, buildOrderItem(part)]);
    }
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

  return {
    items,
    deleteTarget,
    setDeleteTarget,
    undoState,
    setUndoState,
    addPart,
    updateQty,
    updateField,
    removeItem,
    undoDelete,
  };
}

"use client";

import { useState } from "react";
import type { OrderItem, PartRefreshConflict, PartRefreshResult, RefreshConflictState } from "@/components/orders/types/orderBuilderTypes";

const CONFLICT_FIELDS: Array<{ field: keyof OrderItem; label: string }> = [
  { field: "type", label: "Tur" },
  { field: "sellingPriceCny", label: "Sotuv narxi (¥)" },
  { field: "purchasePriceCny", label: "Xarid narxi (¥)" },
  { field: "wholesalePriceCny", label: "Ulgurji narx (¥)" },
];

const AUTO_UPDATE_FIELDS: Array<keyof OrderItem> = ["partName", "categoryName", "brand"];

interface LatestPartData {
  partName: string;
  categoryName: string;
  brand: string;
  type: string;
  sellingPriceCny: number | null;
  purchasePriceCny: number | null;
  wholesalePriceCny: number | null;
  supplierFound: boolean;
}

interface RefreshApiResponse {
  refreshed: Array<{ itemId: string; found: boolean; latest?: LatestPartData }>;
}

function itemKey(item: OrderItem): string {
  return item.id ?? item.partVariantId ?? item.partId ?? item.localId ?? item.partCode;
}

export function useRefreshOrderParts(orderId: string, items: OrderItem[]) {
  const [refreshing, setRefreshing] = useState(false);
  const [conflictState, setConflictState] = useState<RefreshConflictState | null>(null);

  async function refresh(): Promise<{ autoApplied: Record<string, Partial<OrderItem>> } | null> {
    const eligibleItems = items.filter((item) => item.partVariantId);
    if (eligibleItems.length === 0) return null;

    setRefreshing(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/refresh-parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: eligibleItems.map((item) => ({
            itemId: itemKey(item),
            partVariantId: item.partVariantId,
            supplierId: item.supplierId,
          })),
        }),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as RefreshApiResponse;

      const itemMap = new Map(items.map((item) => [itemKey(item), item]));
      const autoApplied: Record<string, Partial<OrderItem>> = {};
      const conflictResults: PartRefreshResult[] = [];

      for (const refreshed of data.refreshed) {
        if (!refreshed.found || !refreshed.latest) continue;
        const current = itemMap.get(refreshed.itemId);
        if (!current) continue;

        const latest = refreshed.latest;
        const autoUpdates: Partial<OrderItem> = {};
        const conflicts: PartRefreshConflict[] = [];

        for (const field of AUTO_UPDATE_FIELDS) {
          const latestVal = latest[field as keyof LatestPartData] as string | null;
          if (latestVal !== undefined && latestVal !== (current[field] as string | null)) {
            (autoUpdates as Record<string, unknown>)[field] = latestVal;
          }
        }

        for (const { field, label } of CONFLICT_FIELDS) {
          const latestVal = latest[field as keyof LatestPartData] as number | string | null;
          const currentVal = current[field] as number | string | null;
          if (latestVal !== undefined && latestVal !== currentVal) {
            conflicts.push({ field, label, currentValue: currentVal, latestValue: latestVal });
          }
        }

        if (Object.keys(autoUpdates).length > 0) {
          autoApplied[refreshed.itemId] = autoUpdates;
        }

        if (conflicts.length > 0 || refreshed.latest.supplierFound === false) {
          conflictResults.push({
            itemId: refreshed.itemId,
            partCode: current.partCode,
            partName: current.partName,
            autoUpdates,
            conflicts,
            supplierNotFound: !refreshed.latest.supplierFound && Boolean(current.supplierId),
          });
        }
      }

      if (conflictResults.length > 0) {
        setConflictState({ results: conflictResults });
      }

      return { autoApplied };
    } finally {
      setRefreshing(false);
    }
  }

  function buildUpdatesFromChoices(
    choices: Record<string, "accept" | "keep">
  ): Record<string, Partial<OrderItem>> {
    if (!conflictState) return {};
    const updates: Record<string, Partial<OrderItem>> = {};
    for (const result of conflictState.results) {
      const choice = choices[result.itemId] ?? "accept";
      const update: Partial<OrderItem> = { ...result.autoUpdates };
      if (choice === "accept") {
        for (const conflict of result.conflicts) {
          (update as Record<string, unknown>)[conflict.field] = conflict.latestValue;
        }
      }
      if (Object.keys(update).length > 0) {
        updates[result.itemId] = update;
      }
    }
    return updates;
  }

  function closeConflicts() {
    setConflictState(null);
  }

  return {
    refreshing,
    conflictState,
    refresh,
    buildUpdatesFromChoices,
    closeConflicts,
  };
}

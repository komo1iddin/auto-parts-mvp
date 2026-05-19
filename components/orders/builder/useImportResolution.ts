"use client";

import { useState } from "react";
import type { PendingResolution } from "@/components/orders/builder/ImportResolutionModal";
import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";

type ResolutionState = {
  types: Record<string, string>;
  prices: Record<string, { purchasePriceCny: string; sellingPriceCny: string }>;
  supplierIds: Record<string, string>;
  bulkSupplierId: string;
};

const EMPTY: ResolutionState = { types: {}, prices: {}, supplierIds: {}, bulkSupplierId: "" };

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function useImportResolution(suppliers: { id: string; name: string }[]) {
  const [pending, setPending] = useState<PendingResolution | null>(null);
  const [state, setState] = useState<ResolutionState>(EMPTY);

  function open(data: PendingResolution) {
    setPending(data);
    setState((prev) => {
      const types: Record<string, string> = {};
      const prices: Record<string, { purchasePriceCny: string; sellingPriceCny: string }> = {};
      const supplierIds: Record<string, string> = {};
      for (const issue of data.issues) {
        const knownExisting = data.typeOptions.some((o) => o.value === issue.existingType) ? issue.existingType : "";
        types[issue.rowKey] = prev.types[issue.rowKey] || knownExisting;
        prices[issue.rowKey] = prev.prices[issue.rowKey] ?? {
          purchasePriceCny: issue.purchasePriceCny == null ? "" : String(issue.purchasePriceCny),
          sellingPriceCny: issue.sellingPriceCny == null ? "" : String(issue.sellingPriceCny),
        };
        supplierIds[issue.rowKey] = prev.supplierIds[issue.rowKey] ?? "";
      }
      return { ...prev, types, prices, supplierIds };
    });
  }

  function reset() {
    setPending(null);
    setState(EMPTY);
  }

  function applyBulkSupplier() {
    if (!state.bulkSupplierId || !pending) return;
    const supplierIds: Record<string, string> = {};
    for (const issue of pending.issues) supplierIds[issue.rowKey] = state.bulkSupplierId;
    setState((prev) => ({ ...prev, supplierIds }));
  }

  function setType(rowKey: string, type: string) {
    setState((prev) => ({ ...prev, types: { ...prev.types, [rowKey]: type } }));
  }

  function setPrice(rowKey: string, field: "purchasePriceCny" | "sellingPriceCny", value: string) {
    setState((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [rowKey]: {
          purchasePriceCny: prev.prices[rowKey]?.purchasePriceCny ?? "",
          sellingPriceCny: prev.prices[rowKey]?.sellingPriceCny ?? "",
          [field]: value,
        },
      },
    }));
  }

  function setSupplierId(rowKey: string, id: string) {
    setState((prev) => ({ ...prev, supplierIds: { ...prev.supplierIds, [rowKey]: id } }));
  }

  function setBulkSupplierId(id: string) {
    setState((prev) => ({ ...prev, bulkSupplierId: id }));
  }

  function buildResolutions() {
    return pending?.issues.map((issue) => ({
      rowKey: issue.rowKey,
      partCode: issue.partCode,
      type: state.types[issue.rowKey] ?? "",
      purchasePriceCny: numberOrNull(state.prices[issue.rowKey]?.purchasePriceCny ?? ""),
      sellingPriceCny: numberOrNull(state.prices[issue.rowKey]?.sellingPriceCny ?? ""),
    })) ?? null;
  }

  function resolveItemSupplier(item: OrderItem, rowKey: string | undefined): OrderItem {
    const supplierId = (rowKey ? state.supplierIds[rowKey] : "") || item.supplierId || state.bulkSupplierId || "";
    if (!supplierId || supplierId === item.supplierId) return item;
    const supplier = suppliers.find((s) => s.id === supplierId);
    return { ...item, supplierId, supplierName: supplier?.name ?? item.supplierName };
  }

  return {
    pending,
    types: state.types,
    prices: state.prices,
    supplierIds: state.supplierIds,
    bulkSupplierId: state.bulkSupplierId,
    open,
    reset,
    applyBulkSupplier,
    setType,
    setPrice,
    setSupplierId,
    setBulkSupplierId,
    buildResolutions,
    resolveItemSupplier,
  };
}

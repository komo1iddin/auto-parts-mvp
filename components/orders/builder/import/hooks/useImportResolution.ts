"use client";

import { useState } from "react";
import type { OrderItem } from "@/components/orders/types/orderBuilderTypes";
import type { PendingResolution, SupplierOption } from "../types";

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

export function useImportResolution(suppliers: SupplierOption[]) {
  const [pending, setPending] = useState<PendingResolution | null>(null);
  const [state, setState] = useState<ResolutionState>(EMPTY);

  function open(data: PendingResolution) {
    setPending(data);
    setState((prev) => {
      const types: ResolutionState["types"] = {};
      const prices: ResolutionState["prices"] = {};
      const supplierIds: ResolutionState["supplierIds"] = {};

      for (const issue of data.issues) {
        const knownExisting = data.typeOptions.some((option) => option.value === issue.existingType)
          ? issue.existingType
          : "";
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
    const supplierIds = Object.fromEntries(pending.issues.map((issue) => [issue.rowKey, state.bulkSupplierId]));
    setState((prev) => ({ ...prev, supplierIds }));
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
    buildResolutions,
    resolveItemSupplier,
    setBulkSupplierId: (id: string) => setState((prev) => ({ ...prev, bulkSupplierId: id })),
    setSupplierId: (rowKey: string, id: string) =>
      setState((prev) => ({ ...prev, supplierIds: { ...prev.supplierIds, [rowKey]: id } })),
    setType: (rowKey: string, type: string) =>
      setState((prev) => ({ ...prev, types: { ...prev.types, [rowKey]: type } })),
    setPrice: (rowKey: string, field: "purchasePriceCny" | "sellingPriceCny", value: string) =>
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
      })),
  };
}

import type { ReactNode } from "react";
import type { OrderFinanceSummary } from "@/lib/order-finance";

export interface DetailItem {
  id: string;
  partId?: string | null;
  partVariantId?: string | null;
  partCode: string;
  partName: string | null;
  type: string | null;
  purchasePriceCny?: { toString(): string } | number | string | null;
  sellingPriceCny?: { toString(): string } | number | string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  quantity: number;
  note: string | null;
}

export interface Revision {
  id: string;
  version: number;
  newOrderNumber: string;
  changeNote: string | null;
  createdAt: Date | string;
  changer?: { name: string } | null;
}

export interface ExportRecord {
  exportType: string;
  language: string;
  createdAt: Date | string;
}

export interface OrderDetail {
  id: string;
  currentOrderNumber: string;
  version: number;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  customer?: { name: string } | null;
  creator?: { name: string } | null;
  updater?: { name: string } | null;
  items: DetailItem[];
  revisions: Revision[];
}

export interface OrderDetailViewProps {
  order: OrderDetail;
  isAdmin: boolean;
  basePath: "/admin/orders" | "/manager/orders";
  exports: ExportRecord[];
  financeSummary?: OrderFinanceSummary;
  financePanel?: ReactNode;
}

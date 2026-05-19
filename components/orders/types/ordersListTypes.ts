export interface OrderListItem {
  id: string;
  currentOrderNumber: string;
  version: number;
  status: string;
  createdAt: string;
  customer?: { name: string } | null;
  creator?: { name: string } | null;
  _count: { items: number };
  totalQty?: number;
  shippedQty?: number;
  totalPurchase?: number;
  totalSelling?: number;
  supplierNames?: (string | null)[];
}

export interface OrdersListProps {
  orders: OrderListItem[];
  total?: number;
  statusCounts?: Record<string, number>;
  status: string;
  basePath: "/admin/orders" | "/manager/orders";
  canShowCreator?: boolean;
}

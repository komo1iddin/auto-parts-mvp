import { OrdersList } from "@/components/orders/OrdersList";
import { getOrdersList } from "@/lib/data";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = params?.status ?? "";
  const { orders, total, statusCounts } = await getOrdersList("admin", "", "", 100);

  return (
    <OrdersList
      orders={orders}
      total={total}
      statusCounts={statusCounts}
      status={status}
      basePath="/admin/orders"
      canShowCreator
    />
  );
}

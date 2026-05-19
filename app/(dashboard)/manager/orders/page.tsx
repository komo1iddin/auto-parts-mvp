import { OrdersList } from "@/components/orders/OrdersList";
import { getAuthUser } from "@/lib/auth";
import { getOrdersList } from "@/lib/data";

export default async function ManagerOrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const [user, params] = await Promise.all([getAuthUser(), searchParams]);
  const status = params?.status ?? "";
  const { orders, total, statusCounts } = await getOrdersList("manager", user!.id, "", 100);

  return (
    <OrdersList
      orders={orders}
      total={total}
      statusCounts={statusCounts}
      status={status}
      basePath="/manager/orders"
    />
  );
}

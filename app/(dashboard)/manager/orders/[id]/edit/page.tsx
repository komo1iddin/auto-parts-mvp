import { getAuthUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { OrderBuilder } from "@/components/orders/OrderBuilder";
import { getOrderDetailFast } from "@/lib/order-detail-query";

export default async function ManagerEditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthUser();

  const order = await getOrderDetailFast(id);

  if (!order) notFound();
  if (order.createdBy !== user?.id) redirect("/manager/orders");
  if (order.status === "cancelled") redirect(`/manager/orders/${id}`);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Buyurtmani tahrirlash</h1>
      <p className="text-gray-500 text-sm mb-6 font-mono">{order.currentOrderNumber}</p>
      <OrderBuilder
        isAdmin={false}
        redirectTo={`/manager/orders/${id}`}
        ordersPath="/manager/orders"
        existingOrder={{
          id: order.id,
          status: order.status,
          customerId: order.customerId,
          items: order.items.map((i) => ({
            id: i.id,
            partId: i.partId ?? "",
            partVariantId: i.partVariantId ?? "",
            partCode: i.partCode,
            partName: i.partName ?? "",
            categoryName: i.categoryName ?? "",
            brand: i.brand ?? "",
            type: i.type ?? "original",
            sellingPriceCny: i.sellingPriceCny ? Number(i.sellingPriceCny) : null,
            purchasePriceCny: null,
            wholesalePriceCny: null,
            supplierId: "",
            supplierName: "",
            quantity: i.quantity,
            shippedQuantity: i.shippedQuantity ?? 0,
            fulfillmentStatus: i.fulfillmentStatus ?? "waiting",
            note: i.note ?? "",
          })),
        }}
      />
    </div>
  );
}

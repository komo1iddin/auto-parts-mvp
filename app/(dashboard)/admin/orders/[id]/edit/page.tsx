import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OrderBuilder } from "@/components/orders/OrderBuilder";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { orderBy: { partCode: "asc" } } },
  });

  if (!order) notFound();
  if (order.status === "cancelled") {
    return (
      <div className="p-8 text-center text-gray-400">
        Bekor qilingan buyurtmani tahrirlash mumkin emas.
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Buyurtmani tahrirlash
      </h1>
      <p className="text-gray-500 text-sm mb-6 font-mono">{order.currentOrderNumber}</p>
      <OrderBuilder
        isAdmin={true}
        redirectTo={`/admin/orders/${id}`}
        existingOrder={{
          id: order.id,
          status: order.status,
          items: order.items.map((i) => ({
            partId: i.partId ?? i.id,
            partCode: i.partCode,
            partName: i.partName ?? "",
            categoryName: i.categoryName ?? "",
            brand: i.brand ?? "",
            type: i.type ?? "original",
            sellingPriceCny: i.sellingPriceCny ? Number(i.sellingPriceCny) : null,
            purchasePriceCny: i.purchasePriceCny ? Number(i.purchasePriceCny) : null,
            wholesalePriceCny: i.wholesalePriceCny ? Number(i.wholesalePriceCny) : null,
            supplierId: i.supplierId ?? "",
            supplierName: i.supplierName ?? "",
            quantity: i.quantity,
            note: i.note ?? "",
          })),
        }}
      />
    </div>
  );
}

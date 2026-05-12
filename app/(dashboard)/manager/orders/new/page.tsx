import { OrderBuilder } from "@/components/orders/OrderBuilder";

export default function ManagerNewOrderPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Yangi buyurtma</h1>
      <OrderBuilder isAdmin={false} redirectTo="/manager/orders" />
    </div>
  );
}

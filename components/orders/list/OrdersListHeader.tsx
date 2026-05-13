import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface OrdersListHeaderProps {
  total?: number;
  isAdmin: boolean;
  basePath: "/admin/orders" | "/manager/orders";
}

export function OrdersListHeader({ total, isAdmin, basePath }: OrdersListHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? "Buyurtmalar" : "Mening buyurtmalarim"}
        </h1>
        {typeof total === "number" && (
          <p className="mt-1 text-sm text-gray-500">Jami: {total} ta</p>
        )}
      </div>
      <Link href={`${basePath}/new`}>
        <Button>Yangi buyurtma</Button>
      </Link>
    </div>
  );
}

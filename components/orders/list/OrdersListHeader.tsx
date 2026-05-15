import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface OrdersListHeaderProps {
  total?: number;
  isAdmin: boolean;
  basePath: "/admin/orders" | "/manager/orders";
}

export function OrdersListHeader({ total, isAdmin, basePath }: OrdersListHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-gray-900">
          {isAdmin ? "Buyurtmalar" : "Mening buyurtmalarim"}
        </h1>
        {typeof total === "number" && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-gray-500">
            {total}
          </span>
        )}
      </div>
      <Link href={`${basePath}/new`}>
        <Button size="md">
          <Plus size={16} />
          Yangi buyurtma
        </Button>
      </Link>
    </div>
  );
}

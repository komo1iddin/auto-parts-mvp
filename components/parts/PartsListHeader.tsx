import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PartsListHeaderProps {
  total: number;
  isAdmin: boolean;
  onCreate: () => void;
}

export function PartsListHeader({ total, isAdmin, onCreate }: PartsListHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isAdmin ? "Qismlar" : "Qismlar qidirish"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">Jami: {total} ta qism</p>
      </div>
      {isAdmin && (
        <Button onClick={onCreate}>
          <Plus className="size-4" />
          Yangi qism
        </Button>
      )}
    </div>
  );
}

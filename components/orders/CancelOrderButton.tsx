"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: string;
}

export function CancelOrderButton({ orderId, orderNumber }: CancelOrderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function cancelOrder() {
    if (!confirm(`"${orderNumber}" buyurtmasini o'chirishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  return (
    <Button variant="destructive" onClick={cancelOrder} disabled={isPending}>
      <Trash2 className="size-4" />
      {isPending ? "O'chirilmoqda..." : "O'chirish"}
    </Button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface CancelOrderButtonProps {
  orderId: string;
  orderNumber: string;
}

export function CancelOrderButton({ orderId, orderNumber }: CancelOrderButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function cancelOrder() {
    await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)} disabled={isPending}>
        <Trash2 className="size-4" />
        {isPending ? "O'chirilmoqda..." : "O'chirish"}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Buyurtmani o'chirish" className="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-mono font-semibold text-gray-900">{orderNumber}</span>{" "}
            buyurtmasini o'chirishni tasdiqlaysizmi?
          </p>
          <p className="text-xs text-gray-400">
            Buyurtma ro'yxatda bekor qilingan holatiga o'tkaziladi.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isPending}>
              Qolish
            </Button>
            <Button variant="destructive" onClick={cancelOrder} disabled={isPending}>
              <Trash2 className="size-4" />
              {isPending ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

interface OrderTitleEditorProps {
  orderId: string;
  title: string;
}

export function OrderTitleEditor({ orderId, title }: OrderTitleEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(title);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setValue(title);
    setError("");
  }

  async function rename() {
    const nextTitle = value.trim();
    if (!nextTitle) {
      setError("Nomi bo'sh bo'lishi mumkin emas");
      return;
    }
    if (nextTitle === title) {
      close();
      return;
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentOrderNumber: nextTitle }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Nomni o'zgartirib bo'lmadi");
      return;
    }

    setOpen(false);
    startTransition(() => router.refresh());
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group -mx-1 inline-flex max-w-full cursor-pointer items-center gap-2 rounded-md px-1 text-left font-mono text-2xl font-bold text-gray-950 outline-none transition-colors hover:bg-gray-50 hover:text-gray-700 focus-visible:ring-3 focus-visible:ring-ring/50"
        title="Buyurtma ro'yxati nomini o'zgartirish"
      >
        <span className="truncate">{title}</span>
        <Pencil className="size-4 shrink-0 text-gray-400 transition-colors group-hover:text-gray-700" />
      </button>

      <Modal open={open} onClose={close} title="Buyurtma nomini o'zgartirish" className="max-w-md">
        <div className="space-y-4">
          <Input
            label="Yangi nom"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
          />
          <p className="text-sm text-gray-600">
            Tasdiqlasangiz, bu nom buyurtma ro'yxati nomi sifatida saqlanadi.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close} disabled={isPending}>
              Bekor qilish
            </Button>
            <Button onClick={rename} disabled={isPending}>
              {isPending ? "Saqlanmoqda..." : "Tasdiqlash"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

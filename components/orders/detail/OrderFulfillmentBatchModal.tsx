"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { OrderPartCodeText } from "@/components/orders/detail/OrderPartCodeText";
import { OrderSectionActionButton } from "@/components/orders/detail/OrderSectionActionButton";
import { markLocalMutation } from "@/lib/client/local-mutation";
import { cn } from "@/lib/utils";

export interface FulfillmentModalItem {
  id: string;
  partCode: string;
  partName: string | null;
  quantity: number;
  shippedQuantity: number;
}

interface OrderFulfillmentBatchModalProps {
  orderId: string;
  items: FulfillmentModalItem[];
  disabled?: boolean;
}

export function OrderFulfillmentBatchModal({ orderId, items, disabled }: OrderFulfillmentBatchModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [receivedById, setReceivedById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isPending, startTransition] = useTransition();
  const pendingItems = useMemo(
    () => items.filter((item) => remainingQty(item) > 0),
    [items]
  );
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return pendingItems;
    return pendingItems.filter((item) => item.partCode.toLowerCase().includes(normalized));
  }, [pendingItems, query]);
  const entries = pendingItems
    .map((item) => ({ item, receivedQuantity: clampReceive(receivedById[item.id], remainingQty(item)) }))
    .filter((entry) => entry.receivedQuantity > 0);
  const totalReceived = entries.reduce((sum, entry) => sum + entry.receivedQuantity, 0);

  function close() {
    if (isPending) return;
    setOpen(false);
    setError("");
    setReceivedById({});
  }

  function updateReceived(item: FulfillmentModalItem, value: string) {
    setError("");
    const remaining = remainingQty(item);
    const next = value === "" ? "" : String(clampReceive(value, remaining));
    setReceivedById((current) => ({ ...current, [item.id]: next }));
  }

  async function save() {
    if (!entries.length) {
      setError("Chiqim sonini kiriting");
      return;
    }

    markLocalMutation();
    const response = await fetch(`/api/orders/${orderId}/fulfillment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: entries.map((entry) => ({
          itemId: entry.item.id,
          receivedQuantity: entry.receivedQuantity,
        })),
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => ({}));

    if (!response?.ok) {
      setError(data?.error ?? "Chiqim saqlanmadi");
      return;
    }

    setOpen(false);
    setReceivedById({});
    setError("");
    setNotice(`${entries.length} qator, jami ${totalReceived} ta chiqim saqlandi`);
    window.setTimeout(() => setNotice(""), 2600);
    markLocalMutation();
    startTransition(() => router.refresh());
  }

  return (
    <>
      <OrderSectionActionButton
        onClick={() => setOpen(true)}
        disabled={disabled || pendingItems.length === 0}
        icon={<PackageCheck />}
      >
        Chiqim kiritish
      </OrderSectionActionButton>

      <Modal open={open} onClose={close} title="Chiqim kiritish" className="max-w-4xl">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="max-w-3xl text-sm text-blue-800">
              Hozir chiqqan miqdorni kiriting. Qolgan qismi keyingi chiqimlarda qo'shib boriladi.
            </p>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Part code qidirish"
              className="h-9 w-64 rounded-md border border-blue-100 bg-white px-3 text-sm font-medium outline-none focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-100"
            />
          </div>

          {pendingItems.length === 0 ? (
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-8 text-center text-sm font-semibold text-emerald-700">
              Barcha qismlar to'liq chiqqan.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Kod</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Buyurtma</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Chiqqan</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Qoldi</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Hozir chiqdi</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Keyin qoladi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const remaining = remainingQty(item);
                    const received = clampReceive(receivedById[item.id], remaining);
                    return (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="px-4 py-3 align-middle">
                          <OrderPartCodeText code={item.partCode} />
                        </td>
                        <td className="px-4 py-3 text-center align-middle font-semibold tabular-nums text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-3 text-center align-middle font-semibold tabular-nums text-emerald-700">{item.shippedQuantity}</td>
                        <td className="px-4 py-3 text-center align-middle font-semibold tabular-nums text-amber-700">{remaining}</td>
                        <td className="px-4 py-3 align-middle">
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={receivedById[item.id] ?? ""}
                            onChange={(event) => updateReceived(item, event.target.value)}
                            placeholder="0"
                            className="mx-auto block h-9 w-24 rounded-md border border-input bg-white px-3 text-center text-sm font-semibold tabular-nums shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                          />
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-center align-middle font-semibold tabular-nums",
                          remaining - received > 0 ? "text-gray-700" : "text-emerald-700"
                        )}>
                          {remaining - received}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm font-medium text-gray-400">
                        Bu kod bo'yicha qoldiq topilmadi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <div className="text-sm text-gray-600">
              Kiritiladigan jami: <span className="font-semibold text-gray-950">{totalReceived}</span> ta
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={close} disabled={isPending}>Bekor qilish</Button>
              <Button onClick={() => void save()} disabled={isPending || totalReceived <= 0}>
                {isPending ? "Saqlanmoqda..." : "Chiqimni saqlash"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-lg border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg"
        >
          <CheckCircle2 className="size-4" />
          {notice}
        </div>
      )}
    </>
  );
}

function remainingQty(item: FulfillmentModalItem) {
  return Math.max(item.quantity - item.shippedQuantity, 0);
}

function clampReceive(value: unknown, max: number) {
  const received = Math.max(0, Math.floor(Number(value) || 0));
  return Math.min(received, max);
}

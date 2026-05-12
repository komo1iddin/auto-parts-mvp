"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { PART_TYPES, formatCny } from "@/lib/utils";

interface Part {
  id: string;
  code: string;
  name: string | null;
  brand: string | null;
  type: string;
  sellingPriceCny: string | null;
  purchasePriceCny?: string | null;
  wholesalePriceCny?: string | null;
  category?: { name: string } | null;
  supplier?: { id: string; name: string } | null;
  supplierName?: string;
  supplierId?: string;
}

interface OrderItem {
  partId: string;
  partCode: string;
  partName: string;
  categoryName: string;
  brand: string;
  type: string;
  sellingPriceCny: number | null;
  purchasePriceCny: number | null;
  wholesalePriceCny: number | null;
  supplierId: string;
  supplierName: string;
  quantity: number;
  note: string;
}

interface OrderBuilderProps {
  isAdmin: boolean;
  existingOrder?: {
    id: string;
    items: OrderItem[];
    status: string;
  };
  redirectTo: string;
}

export function OrderBuilder({ isAdmin, existingOrder, redirectTo }: OrderBuilderProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [searchResults, setSearchResults] = useState<Part[]>([]);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<OrderItem[]>(existingOrder?.items ?? []);
  const [status, setStatus] = useState(existingOrder?.status ?? "draft");
  const [changeNote, setChangeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/parts?q=${encodeURIComponent(query)}&take=20`);
    const data = await res.json();
    setSearchResults(data.parts ?? []);
    setSearching(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  function addPart(part: Part) {
    const exists = items.find((i) => i.partId === part.id);
    if (exists) {
      setItems((prev) => prev.map((i) => i.partId === part.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems((prev) => [
        ...prev,
        {
          partId: part.id,
          partCode: part.code,
          partName: part.name ?? "",
          categoryName: part.category?.name ?? "",
          brand: part.brand ?? "",
          type: part.type,
          sellingPriceCny: part.sellingPriceCny ? Number(part.sellingPriceCny) : null,
          purchasePriceCny: part.purchasePriceCny ? Number(part.purchasePriceCny) : null,
          wholesalePriceCny: part.wholesalePriceCny ? Number(part.wholesalePriceCny) : null,
          supplierId: part.supplier?.id ?? "",
          supplierName: part.supplier?.name ?? "",
          quantity: 1,
          note: "",
        },
      ]);
    }
    setQ("");
    setSearchResults([]);
  }

  function updateQty(partId: string, qty: number) {
    if (qty < 1) { removeItem(partId); return; }
    setItems((prev) => prev.map((i) => i.partId === partId ? { ...i, quantity: qty } : i));
  }

  function updateNote(partId: string, note: string) {
    setItems((prev) => prev.map((i) => i.partId === partId ? { ...i, note } : i));
  }

  function removeItem(partId: string) {
    setItems((prev) => prev.filter((i) => i.partId !== partId));
  }

  const totalSelling = items.reduce((s, i) => s + (i.sellingPriceCny ?? 0) * i.quantity, 0);
  const totalPurchase = items.reduce((s, i) => s + (i.purchasePriceCny ?? 0) * i.quantity, 0);

  async function save() {
    if (!items.length) { setError("Kamida bitta qism kerak"); return; }
    setSaving(true);
    setError("");

    const url = existingOrder ? `/api/orders/${existingOrder.id}` : "/api/orders";
    const method = existingOrder ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, status, changeNote }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      setSaving(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Qism qidirish</h2>
        <div className="relative">
          <Input
            placeholder="Qism kodi, nomi yoki brend..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {searching && (
            <p className="text-xs text-gray-400 mt-1">Qidirilmoqda...</p>
          )}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 mt-1 max-h-64 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addPart(p)}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-center gap-3"
                >
                  <div className="flex-1">
                    <span className="font-mono text-xs font-semibold text-gray-800">{p.code}</span>
                    {p.name && <span className="text-gray-500 text-xs ml-2">{p.name}</span>}
                    {p.brand && <span className="text-gray-400 text-xs ml-1">• {p.brand}</span>}
                  </div>
                  <span className="text-xs text-gray-400">{PART_TYPES[p.type]}</span>
                  {p.sellingPriceCny && (
                    <span className="text-xs font-medium text-blue-600">{formatCny(p.sellingPriceCny)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Buyurtma qismlari</h2>
          <span className="text-sm text-gray-500">{items.length} ta qism</span>
        </div>

        {items.length === 0 ? (
          <p className="p-12 text-center text-gray-400">Hali qism qo'shilmagan</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Kod</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nomi</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Turi</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-gray-500 font-medium">Xarid (¥)</th>}
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Sotuv (¥)</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Miqdor</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-gray-500 font-medium">Ta'minotchi</th>}
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Izoh</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.partId} className="border-b border-gray-50">
                    <td className="px-4 py-2 font-mono text-xs font-semibold">{item.partCode}</td>
                    <td className="px-4 py-2 text-gray-700 text-xs">{item.partName || "—"}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">{PART_TYPES[item.type] ?? item.type}</td>
                    {isAdmin && <td className="px-4 py-2 text-xs">{formatCny(item.purchasePriceCny)}</td>}
                    <td className="px-4 py-2 text-xs">{formatCny(item.sellingPriceCny)}</td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.partId, Number(e.target.value))}
                        className="h-8 w-16 text-center text-xs"
                      />
                    </td>
                    {isAdmin && <td className="px-4 py-2 text-xs text-gray-500">{item.supplierName || "—"}</td>}
                    <td className="px-4 py-2">
                      <Input
                        type="text"
                        value={item.note}
                        onChange={(e) => updateNote(item.partId, e.target.value)}
                        placeholder="Izoh..."
                        className="h-8 w-28 text-xs"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.partId)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {items.length > 0 && (
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex gap-6 text-sm">
            <span className="text-gray-600">
              Jami miqdor: <strong>{items.reduce((s, i) => s + i.quantity, 0)}</strong>
            </span>
            {isAdmin && (
              <span className="text-gray-600">
                Xarid jami: <strong className="text-red-600">{formatCny(totalPurchase)}</strong>
              </span>
            )}
            <span className="text-gray-600">
              Sotuv jami: <strong className="text-green-600">{formatCny(totalSelling)}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <Select
          label="Holat"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="max-w-xs"
        >
            <option value="draft">Qoralama</option>
            <option value="confirmed">Tasdiqlangan</option>
        </Select>

        {existingOrder && (
          <Input
            label="O'zgartirish izohi"
            type="text"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            placeholder="Nima o'zgartirildi?"
            className="max-w-sm"
          />
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={save} disabled={saving || !items.length}>
          {saving ? "Saqlanmoqda..." : existingOrder ? "Yangilash" : "Buyurtma yaratish"}
        </Button>
        <Button variant="secondary" onClick={() => router.push(redirectTo)}>
          Bekor qilish
        </Button>
      </div>
    </div>
  );
}

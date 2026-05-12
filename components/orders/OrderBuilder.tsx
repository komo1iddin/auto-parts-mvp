"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const originalItems = useRef<OrderItem[]>(existingOrder?.items ?? []);

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

  const duplicateCodes = new Set(
    items
      .map((i) => i.partCode)
      .filter((code, _, arr) => arr.filter((c) => c === code).length > 1)
  );

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

  function updateField<K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) {
    setItems((prev) => prev.map((i) => i.partId === partId ? { ...i, [field]: value } : i));
  }

  function removeItem(partId: string) {
    setItems((prev) => prev.filter((i) => i.partId !== partId));
    setPendingDelete(null);
  }

  const totalSelling = items.reduce((s, i) => s + (i.sellingPriceCny ?? 0) * i.quantity, 0);
  const totalPurchase = items.reduce((s, i) => s + (i.purchasePriceCny ?? 0) * i.quantity, 0);

  function buildChangelog(): string {
    const orig = originalItems.current;
    const lines: string[] = [];

    for (const item of items) {
      const old = orig.find((o) => o.partId === item.partId);
      if (!old) {
        lines.push(`+ ${item.partCode} qo'shildi (x${item.quantity})`);
        continue;
      }
      const changes: string[] = [];
      if (old.quantity !== item.quantity) changes.push(`miqdor ${old.quantity}→${item.quantity}`);
      if (old.purchasePriceCny !== item.purchasePriceCny) changes.push(`xarid ¥${old.purchasePriceCny}→¥${item.purchasePriceCny}`);
      if (old.sellingPriceCny !== item.sellingPriceCny) changes.push(`sotuv ¥${old.sellingPriceCny}→¥${item.sellingPriceCny}`);
      if (old.type !== item.type) changes.push(`tur ${old.type}→${item.type}`);
      if (old.supplierName !== item.supplierName) changes.push(`ta'minotchi "${old.supplierName}"→"${item.supplierName}"`);
      if (changes.length) lines.push(`${item.partCode}: ${changes.join(", ")}`);
    }

    for (const old of orig) {
      if (!items.find((i) => i.partId === old.partId)) {
        lines.push(`- ${old.partCode} o'chirildi`);
      }
    }

    return lines.join("; ") || "O'zgarishlar kiritildi";
  }

  async function save() {
    if (!items.length) { setError("Kamida bitta qism kerak"); return; }
    setSaving(true);
    setError("");

    const finalNote = existingOrder
      ? (changeNote.trim() || buildChangelog())
      : changeNote;

    const url = existingOrder ? `/api/orders/${existingOrder.id}` : "/api/orders";
    const method = existingOrder ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, status, changeNote: finalNote }),
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
              {searchResults.map((p) => {
                const alreadyInOrder = items.some((i) => i.partCode === p.code);
                return (
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
                    {alreadyInOrder && (
                      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">
                        mavjud
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{PART_TYPES[p.type]}</span>
                    {p.sellingPriceCny && (
                      <span className="text-xs font-medium text-blue-600">{formatCny(p.sellingPriceCny)}</span>
                    )}
                  </button>
                );
              })}
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
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Kod</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Nomi</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Turi</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Xarid (¥)</th>}
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Sotuv (¥)</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Miqdor</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Ta'minotchi</th>}
                  <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs">Izoh</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.partId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold">{item.partCode}</span>
                        {duplicateCodes.has(item.partCode) && (
                          <span
                            title="Bu kod buyurtmada bir necha marta mavjud"
                            className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700"
                          >
                            2×
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-xs">{item.partName || "—"}</td>
                    <td className="px-4 py-2">
                      <select
                        value={item.type}
                        onChange={(e) => updateField(item.partId, "type", e.target.value)}
                        className="h-7 rounded border border-gray-200 bg-white px-1.5 text-xs text-gray-700 outline-none focus:border-blue-400"
                      >
                        {Object.entries(PART_TYPES).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.purchasePriceCny ?? ""}
                          onChange={(e) => updateField(item.partId, "purchasePriceCny", e.target.value === "" ? null : Number(e.target.value))}
                          className="h-7 w-20 text-xs"
                          placeholder="0"
                        />
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.sellingPriceCny ?? ""}
                        onChange={(e) => updateField(item.partId, "sellingPriceCny", e.target.value === "" ? null : Number(e.target.value))}
                        className="h-7 w-20 text-xs"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQty(item.partId, Number(e.target.value))}
                        className="h-7 w-16 text-center text-xs"
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2">
                        <Input
                          type="text"
                          value={item.supplierName}
                          onChange={(e) => updateField(item.partId, "supplierName", e.target.value)}
                          placeholder="Ta'minotchi..."
                          className="h-7 w-24 text-xs"
                        />
                      </td>
                    )}
                    <td className="px-4 py-2">
                      <Input
                        type="text"
                        value={item.note}
                        onChange={(e) => updateNote(item.partId, e.target.value)}
                        placeholder="Izoh..."
                        className="h-7 w-28 text-xs"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {pendingDelete === item.partId ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => removeItem(item.partId)}
                            className="text-xs text-white bg-red-500 hover:bg-red-600 rounded px-2 py-0.5"
                          >
                            Ha
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(null)}
                            className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded px-2 py-0.5"
                          >
                            Yo'q
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(item.partId)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
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
          <div className="space-y-1">
            <Input
              label="O'zgartirish izohi"
              type="text"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="Bo'sh qoldirsangiz, avtomatik to'ldiriladi"
              className="max-w-sm"
            />
            <p className="text-xs text-gray-400">
              Avtomat: {buildChangelog()}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      {/* bottom padding so content isn't hidden behind sticky bar */}
      <div className="h-20" />

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>
              <span className="text-gray-400">Qismlar:</span>{" "}
              <strong>{items.length}</strong>
            </span>
            <span>
              <span className="text-gray-400">Miqdor:</span>{" "}
              <strong>{items.reduce((s, i) => s + i.quantity, 0)}</strong>
            </span>
            {isAdmin && (
              <span>
                <span className="text-gray-400">Xarid:</span>{" "}
                <strong className="text-red-600">{formatCny(totalPurchase)}</strong>
              </span>
            )}
            <span>
              <span className="text-gray-400">Sotuv:</span>{" "}
              <strong className="text-green-600">{formatCny(totalSelling)}</strong>
            </span>
            {isAdmin && totalSelling > 0 && totalPurchase > 0 && (
              <span>
                <span className="text-gray-400">Foyda:</span>{" "}
                <strong className={totalSelling - totalPurchase >= 0 ? "text-green-600" : "text-red-600"}>
                  {formatCny(totalSelling - totalPurchase)}
                </strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => router.push(redirectTo)}>
              Bekor qilish
            </Button>
            <Button onClick={save} disabled={saving || !items.length}>
              {saving ? "Saqlanmoqda..." : existingOrder ? "Yangilash" : "Buyurtma yaratish"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SelectField } from "@/components/ui/SelectField";
import { Modal } from "@/components/ui/Modal";
import { PART_TYPES, formatCny } from "@/lib/utils";
import { OrderItemsTable } from "./OrderItemsTable";
import { OrderBuilderBar } from "./OrderBuilderBar";

interface Supplier {
  id: string;
  name: string;
}

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
}

export interface OrderItem {
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
  const [deleteTarget, setDeleteTarget] = useState<OrderItem | null>(null);
  const [undoState, setUndoState] = useState<{ item: OrderItem; index: number } | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const originalItems = useRef<OrderItem[]>(existingOrder?.items ?? []);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []));
  }, []);

  useEffect(() => {
    if (!undoState) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoState(null), 6000);
    return () => { if (undoTimer.current) clearTimeout(undoTimer.current); };
  }, [undoState]);

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
    items.map((i) => i.partCode).filter((code, _, arr) => arr.filter((c) => c === code).length > 1)
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
    const safe = Math.max(0, Math.floor(qty));
    setItems((prev) => prev.map((i) => i.partId === partId ? { ...i, quantity: safe } : i));
  }

  function updateField<K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) {
    setItems((prev) => prev.map((i) => i.partId === partId ? { ...i, [field]: value } : i));
  }

  function removeItem(partId: string) {
    const idx = items.findIndex((i) => i.partId === partId);
    const item = items[idx];
    setItems((prev) => prev.filter((i) => i.partId !== partId));
    setDeleteTarget(null);
    if (item) setUndoState({ item, index: idx });
  }

  function undoDelete() {
    if (!undoState) return;
    setItems((prev) => {
      const next = [...prev];
      next.splice(undoState.index, 0, undoState.item);
      return next;
    });
    setUndoState(null);
  }

  const totalSelling = items.reduce((s, i) => s + (i.sellingPriceCny ?? 0) * i.quantity, 0);
  const totalPurchase = items.reduce((s, i) => s + (i.purchasePriceCny ?? 0) * i.quantity, 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);

  function buildChangelog(): string {
    const orig = originalItems.current;
    const lines: string[] = [];
    for (const item of items) {
      const old = orig.find((o) => o.partId === item.partId);
      if (!old) { lines.push(`+ ${item.partCode} qo'shildi (x${item.quantity})`); continue; }
      const changes: string[] = [];
      if (old.quantity !== item.quantity) changes.push(`miqdor ${old.quantity}→${item.quantity}`);
      if (old.purchasePriceCny !== item.purchasePriceCny) changes.push(`xarid ¥${old.purchasePriceCny}→¥${item.purchasePriceCny}`);
      if (old.sellingPriceCny !== item.sellingPriceCny) changes.push(`sotuv ¥${old.sellingPriceCny}→¥${item.sellingPriceCny}`);
      if (old.type !== item.type) changes.push(`tur ${old.type}→${item.type}`);
      if (old.supplierName !== item.supplierName) changes.push(`ta'minotchi "${old.supplierName}"→"${item.supplierName}"`);
      if (changes.length) lines.push(`${item.partCode}: ${changes.join(", ")}`);
    }
    for (const old of orig) {
      if (!items.find((i) => i.partId === old.partId)) lines.push(`- ${old.partCode} o'chirildi`);
    }
    return lines.join("; ") || "O'zgarishlar kiritildi";
  }

  async function save() {
    if (!items.length) { setError("Kamida bitta qism kerak"); return; }
    setSaving(true);
    setError("");
    const finalNote = existingOrder ? (changeNote.trim() || buildChangelog()) : changeNote;
    const url = existingOrder ? `/api/orders/${existingOrder.id}` : "/api/orders";
    const method = existingOrder ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, status, changeNote: finalNote }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Xatolik yuz berdi"); setSaving(false); return; }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-800 mb-3">Qism qidirish</h2>
        <div className="relative max-w-sm">
          <Input
            placeholder="Qism kodi, nomi yoki brend..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {searching && <p className="text-xs text-gray-400 mt-1">Qidirilmoqda...</p>}
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
                    <div className="flex-1 min-w-0">
                      <span className="font-mono text-xs font-semibold text-gray-800">{p.code}</span>
                      {p.name && <span className="text-gray-500 text-xs ml-2">{p.name}</span>}
                      {p.brand && <span className="text-gray-400 text-xs ml-1">• {p.brand}</span>}
                    </div>
                    {alreadyInOrder && (
                      <span className="shrink-0 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700">mavjud</span>
                    )}
                    <span className="shrink-0 text-xs text-gray-400">{PART_TYPES[p.type]}</span>
                    {p.sellingPriceCny && (
                      <span className="shrink-0 text-xs font-medium text-blue-600">{formatCny(p.sellingPriceCny)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Items table */}
      <OrderItemsTable
        items={items}
        isAdmin={isAdmin}
        suppliers={suppliers}
        duplicateCodes={duplicateCodes}
        updateField={updateField}
        updateQty={updateQty}
        onDelete={(item) => setDeleteTarget(item)}
      />

      {/* Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="w-48">
          <SelectField
            label="Holat"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">Qoralama</option>
            <option value="confirmed">Tasdiqlangan</option>
          </SelectField>
        </div>

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
            <p className="text-xs text-gray-400">Avtomat: {buildChangelog()}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="h-20" />

      <OrderBuilderBar
        itemCount={items.length}
        totalQty={totalQty}
        totalPurchase={totalPurchase}
        totalSelling={totalSelling}
        isAdmin={isAdmin}
        undoState={undoState}
        onUndo={undoDelete}
        onDismissUndo={() => setUndoState(null)}
        saving={saving}
        isEdit={!!existingOrder}
        onCancel={() => router.push(redirectTo)}
        onSave={save}
      />

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Qismni o'chirish"
        className="max-w-sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Quyidagi qismni buyurtmadan o'chirasizmi?
            </p>
            <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <div className="font-mono font-semibold text-gray-800">{deleteTarget.partCode}</div>
              {deleteTarget.partName && (
                <div className="text-gray-500 text-xs mt-0.5">{deleteTarget.partName}</div>
              )}
              <div className="text-gray-400 text-xs mt-1">Miqdor: {deleteTarget.quantity}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Bekor qilish
              </Button>
              <Button variant="destructive" onClick={() => removeItem(deleteTarget.partId)}>
                O'chirish
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, X, Undo2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { cn, PART_TYPES, formatCny } from "@/lib/utils";

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

/** Inline select for table cells — shadcn style, no label wrapper */
function TableSelect({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width: number;
}) {
  return (
    <div className="relative" style={{ width }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex h-7 w-full appearance-none rounded-md border border-input bg-background px-2 py-0 pr-6 text-xs shadow-xs transition-colors outline-none",
          "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

/** Inline number input for table cells */
function TableInput({
  value,
  onChange,
  width,
  center,
  placeholder,
}: {
  value: string | number;
  onChange: (v: string) => void;
  width: number;
  center?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      min={0}
      step={0.01}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "0"}
      className={cn(
        "flex h-7 rounded-md border border-input bg-background px-2 py-0 text-xs shadow-xs transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50",
        center && "text-center"
      )}
      style={{ width }}
    />
  );
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

  // Auto-dismiss undo toast after 6s
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
    // Never auto-delete on quantity change — user must use X button explicitly
    const safe = Math.max(0, Math.floor(qty));
    setItems((prev) => prev.map((i) => i.partId === partId ? { ...i, quantity: safe } : i));
  }

  function updateField<K extends keyof OrderItem>(partId: string, field: K, value: OrderItem[K]) {
    setItems((prev) => prev.map((i) => i.partId === partId ? { ...i, [field]: value } : i));
  }

  function confirmDelete(item: OrderItem) {
    setDeleteTarget(item);
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

  const typeOptions = Object.entries(PART_TYPES).map(([k, v]) => ({ value: k, label: v }));
  const supplierOptions = [
    { value: "", label: "—" },
    ...suppliers.map((s) => ({ value: s.id, label: s.name })),
  ];

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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">Kod</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nomi</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Turi</th>
                  {isAdmin && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">Xarid (¥)</th>}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">Sotuv (¥)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Miqdor</th>
                  {isAdmin && <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">Ta'minotchi</th>}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Izoh</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.partId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    {/* Kod */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-gray-800">{item.partCode}</span>
                        {duplicateCodes.has(item.partCode) && (
                          <span
                            title="Bu kod buyurtmada bir necha marta mavjud"
                            className="shrink-0 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700"
                          >
                            2×
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Nomi */}
                    <td className="px-4 py-2 text-gray-600 text-xs max-w-[120px] truncate">{item.partName || "—"}</td>

                    {/* Turi */}
                    <td className="px-4 py-2 text-center">
                      <TableSelect
                        value={item.type}
                        onChange={(v) => updateField(item.partId, "type", v)}
                        options={typeOptions}
                        width={96}
                      />
                    </td>

                    {/* Xarid */}
                    {isAdmin && (
                      <td className="px-4 py-2 text-center">
                        <TableInput
                          value={item.purchasePriceCny ?? ""}
                          onChange={(v) => updateField(item.partId, "purchasePriceCny", v === "" ? null : Number(v))}
                          width={72}
                          placeholder="0"
                        />
                      </td>
                    )}

                    {/* Sotuv */}
                    <td className="px-4 py-2 text-center">
                      <TableInput
                        value={item.sellingPriceCny ?? ""}
                        onChange={(v) => updateField(item.partId, "sellingPriceCny", v === "" ? null : Number(v))}
                        width={72}
                        placeholder="0"
                      />
                    </td>

                    {/* Miqdor */}
                    <td className="px-4 py-2 text-center">
                      <TableInput
                        value={item.quantity}
                        onChange={(v) => updateQty(item.partId, Number(v))}
                        width={56}
                        center
                      />
                    </td>

                    {/* Ta'minotchi */}
                    {isAdmin && (
                      <td className="px-4 py-2 text-center">
                        <TableSelect
                          value={item.supplierId}
                          onChange={(v) => {
                            const sup = suppliers.find((s) => s.id === v);
                            updateField(item.partId, "supplierId", v);
                            updateField(item.partId, "supplierName", sup?.name ?? "");
                          }}
                          options={supplierOptions}
                          width={110}
                        />
                      </td>
                    )}

                    {/* Izoh */}
                    <td className="px-4 py-2 text-center">
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => updateField(item.partId, "note", e.target.value)}
                        placeholder="Izoh..."
                        className={cn(
                          "flex h-7 rounded-md border border-input bg-background px-2 py-0 text-xs shadow-xs transition-colors outline-none",
                          "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
                        )}
                        style={{ width: 100 }}
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => confirmDelete(item)}
                        className="inline-flex items-center justify-center size-6 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <Select
          label="Holat"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-48"
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

      {/* Undo toast */}
      {undoState && (
        <div className="fixed bottom-20 left-64 right-0 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2.5 shadow-lg text-sm">
            <span className="text-gray-600">
              <span className="font-mono font-semibold text-gray-800">{undoState.item.partCode}</span>{" "}
              o'chirildi
            </span>
            <button
              type="button"
              onClick={undoDelete}
              className="flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 transition-colors"
            >
              <Undo2 className="size-3" />
              Qaytarish
            </button>
            <button
              type="button"
              onClick={() => setUndoState(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Sticky action bar — left-64 matches sidebar w-64 */}
      <div className="fixed bottom-0 left-64 right-0 z-40 border-t border-gray-200 bg-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>
              <span className="text-gray-400">Qismlar:</span>{" "}
              <strong>{items.length}</strong>
            </span>
            <span>
              <span className="text-gray-400">Miqdor:</span>{" "}
              <strong>{totalQty}</strong>
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
            {isAdmin && (totalSelling > 0 || totalPurchase > 0) && (
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

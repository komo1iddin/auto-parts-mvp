"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  wechat: string | null;
  note: string | null;
}

export function SuppliersList({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", wechat: "", note: "" });
  const [saving, setSaving] = useState(false);

  function refreshSuppliers() {
    startTransition(() => router.refresh());
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", phone: "", wechat: "", note: "" });
    setOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? "",
      wechat: supplier.wechat ?? "",
      note: supplier.note ?? "",
    });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const url = editing ? `/api/suppliers/${editing.id}` : "/api/suppliers";
    await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setSaving(false);
    refreshSuppliers();
  }

  async function deleteSupplier(id: string, name: string) {
    if (!confirm(`"${name}" ta'minotchisini o'chirishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    refreshSuppliers();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ta'minotchilar</h1>
          <p className="mt-1 text-sm text-gray-500">Jami: {suppliers.length} ta</p>
        </div>
        <Button onClick={openCreate}>Yangi ta'minotchi</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">Nomi</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Telefon</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">WeChat</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Izoh</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className={isPending ? "opacity-60" : ""}>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{supplier.name}</td>
                <td className="px-5 py-3 text-gray-500">{supplier.phone ?? "-"}</td>
                <td className="px-5 py-3 text-gray-500">{supplier.wechat ?? "-"}</td>
                <td className="max-w-xs truncate px-5 py-3 text-gray-500">{supplier.note ?? "-"}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(supplier)}>Tahrirlash</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteSupplier(supplier.id, supplier.name)}
                    >
                      O'chirish
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!suppliers.length && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  Ta'minotchilar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Ta'minotchini tahrirlash" : "Yangi ta'minotchi"}>
        <div className="space-y-4">
          <Input label="Nomi *" value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} placeholder="Ta'minotchi nomi" />
          <Input label="Telefon" value={form.phone} onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))} placeholder="+86 xxx" />
          <Input label="WeChat" value={form.wechat} onChange={(event) => setForm((f) => ({ ...f, wechat: event.target.value }))} placeholder="WeChat ID" />
          <Textarea
            label="Izoh"
            value={form.note}
            onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))}
            rows={2}
            className="resize-none"
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={!form.name.trim() || saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

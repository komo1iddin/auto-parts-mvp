"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  note: string | null;
}

export function CustomersList({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function refreshCustomers() {
    startTransition(() => router.refresh());
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", phone: "", note: "" });
    setError("");
    setOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone ?? "",
      note: customer.note ?? "",
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
    const response = await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      return;
    }
    setOpen(false);
    refreshCustomers();
  }

  async function deleteCustomer(id: string, name: string) {
    if (!confirm(`"${name}" mijozini o'chirishni tasdiqlaysizmi?`)) return;
    const response = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      alert(data.error ?? "Mijozni o'chirib bo'lmadi");
      return;
    }
    refreshCustomers();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mijozlar</h1>
          <p className="mt-1 text-sm text-gray-500">Jami: {customers.length} ta</p>
        </div>
        <Button onClick={openCreate}>Yangi mijoz</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">Nomi</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Telefon</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Izoh</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className={isPending ? "opacity-60" : ""}>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{customer.name}</td>
                <td className="px-5 py-3 text-gray-500">{customer.phone ?? "-"}</td>
                <td className="max-w-xs truncate px-5 py-3 text-gray-500">{customer.note ?? "-"}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(customer)}>Tahrirlash</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteCustomer(customer.id, customer.name)}
                    >
                      O'chirish
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!customers.length && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                  Mijozlar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Mijozni tahrirlash" : "Yangi mijoz"}>
        <div className="space-y-4">
          <Input label="Nomi *" value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} placeholder="Mijoz nomi" />
          <Input label="Telefon" value={form.phone} onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))} placeholder="+998 xx xxx xx xx" />
          <Textarea
            label="Izoh"
            value={form.note}
            onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))}
            rows={2}
            className="resize-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
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

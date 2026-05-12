"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

const ROLES: Record<string, string> = {
  admin: "Admin",
  manager: "Menejer",
  client: "Mijoz",
};

export function UsersList({ users }: { users: User[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "manager" });
  const [saving, setSaving] = useState(false);

  function refreshUsers() {
    startTransition(() => router.refresh());
  }

  function openCreate() {
    setEditUser(null);
    setForm({ name: "", email: "", password: "", role: "manager" });
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    if (editUser) {
      await fetch(`/api/users/${editUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, role: form.role }),
      });
    } else {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Xatolik");
        setSaving(false);
        return;
      }
    }
    setOpen(false);
    setSaving(false);
    refreshUsers();
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`"${name}" foydalanuvchisini o'chirishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    refreshUsers();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar</h1>
          <p className="mt-1 text-sm text-gray-500">Jami: {users.length} ta</p>
        </div>
        <Button onClick={openCreate}>Yangi foydalanuvchi</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left font-medium text-gray-500">Ism</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Rol</th>
              <th className="px-5 py-3 text-left font-medium text-gray-500">Qo'shilgan</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className={isPending ? "opacity-60" : ""}>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{user.name}</td>
                <td className="px-5 py-3 text-gray-500">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : user.role === "manager"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                  }`}>
                    {ROLES[user.role] ?? user.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString("uz")}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>Tahrirlash</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteUser(user.id, user.name)}
                    >
                      O'chirish
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  Foydalanuvchilar yo'q
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editUser ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}>
        <div className="space-y-4">
          <Input label="Ism" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="To'liq ism" />
          {!editUser && (
            <>
              <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
              <Input label="Parol *" type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Kamida 6 belgi" />
            </>
          )}
          <Select
            label="Rol"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="admin">Admin</option>
            <option value="manager">Menejer</option>
            <option value="client">Mijoz</option>
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={saving}>{saving ? "Saqlanmoqda..." : "Saqlash"}</Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

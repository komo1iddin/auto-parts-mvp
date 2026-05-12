"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: Category[];
}

function flattenCategories(categories: Category[], depth = 0): Category[] {
  return categories.flatMap((category) => [
    { ...category, name: "  ".repeat(depth) + category.name },
    ...flattenCategories(category.children ?? [], depth + 1),
  ]);
}

export function CategoriesList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const flat = flattenCategories(categories);

  function refreshCategories() {
    startTransition(() => router.refresh());
  }

  function openCreate() {
    setEditing(null);
    setName("");
    setParentId("");
    setOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setParentId(category.parentId ?? "");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    await fetch(url, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });
    setOpen(false);
    setSaving(false);
    refreshCategories();
  }

  async function deleteCategory(id: string, categoryName: string) {
    if (!confirm(`"${categoryName}" kategoriyasini o'chirishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    refreshCategories();
  }

  function renderTree(items: Category[], depth = 0): React.ReactNode {
    return items.map((category) => (
      <div key={category.id}>
        <div
          className="flex items-center gap-2 border-b border-gray-50 px-4 py-2.5 hover:bg-gray-50"
          style={{ paddingLeft: depth * 24 + 16 }}
        >
          {depth > 0 && <span className="text-gray-300">└</span>}
          <span className="flex-1 text-sm text-gray-800">{category.name}</span>
          <Button size="sm" variant="ghost" onClick={() => openEdit(category)}>Tahrirlash</Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
            onClick={() => deleteCategory(category.id, category.name)}
          >
            O'chirish
          </Button>
        </div>
        {category.children?.length > 0 && renderTree(category.children, depth + 1)}
      </div>
    ));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kategoriyalar</h1>
          <p className="mt-1 text-sm text-gray-500">Jami: {flat.length} ta</p>
        </div>
        <Button onClick={openCreate}>Yangi kategoriya</Button>
      </div>

      <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white ${isPending ? "opacity-60" : ""}`}>
        {categories.length === 0 ? (
          <p className="p-12 text-center text-gray-400">Kategoriyalar yo'q</p>
        ) : (
          renderTree(categories)
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}
      >
        <div className="space-y-4">
          <Input
            label="Nomi *"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Kategoriya nomi"
            required
          />
          <Select
            label="Asosiy kategoriya"
            value={parentId}
            onChange={(event) => setParentId(event.target.value)}
          >
            <option value="">Asosiy kategoriya (top-level)</option>
            {flat.filter((category) => !editing || category.id !== editing.id).map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button onClick={save} disabled={!name.trim() || saving}>
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>Bekor</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

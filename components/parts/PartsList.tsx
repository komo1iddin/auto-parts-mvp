"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PartForm } from "@/components/parts/PartForm";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { PART_TYPES, formatCny } from "@/lib/utils";

interface Part {
  id: string;
  code: string;
  name: string | null;
  brand: string | null;
  type: string;
  purchasePriceCny?: string | null;
  wholesalePriceCny?: string | null;
  sellingPriceCny: string | null;
  imageUrl: string | null;
  note?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  category?: { name: string } | null;
  supplier?: { name: string } | null;
}

interface PartsListProps {
  parts: Part[];
  total: number;
  q: string;
  page: number;
  take: number;
  isAdmin?: boolean;
}

const TAKE_OPTIONS = [20, 50, 100];

export function PartsList({ parts, total, q, page, take, isAdmin = false }: PartsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(q);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewPart, setViewPart] = useState<Part | null>(null);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [imagePreview, setImagePreview] = useState<Part | null>(null);
  const [isPending, startTransition] = useTransition();
  const pageCount = Math.max(1, Math.ceil(total / take));
  const currentPage = Math.min(page, pageCount);
  const startItem = total === 0 ? 0 : (currentPage - 1) * take + 1;
  const endItem = Math.min(total, currentPage * take);

  useEffect(() => setQuery(q), [q]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const nextQuery = query.trim();
      const currentQuery = searchParams.get("q") ?? "";
      if (nextQuery === currentQuery) return;
      if (nextQuery) params.set("q", nextQuery);
      else params.delete("q");
      params.delete("page");
      const href = params.toString() ? `${pathname}?${params}` : pathname;
      startTransition(() => router.replace(href));
    }, 250);

    return () => clearTimeout(timeout);
  }, [pathname, query, router, searchParams]);

  async function deletePart(id: string, code: string) {
    if (!confirm(`"${code}" qismini o'chirishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/parts/${id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
  }

  function openViewPart(part: Part) {
    setViewPart(part);
  }

  function openEditPart(part: Part) {
    setEditPart(part);
  }

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const href = params.toString() ? `${pathname}?${params}` : pathname;
    startTransition(() => router.replace(href));
  }

  function handleCreateSuccess() {
    setCreateOpen(false);
    updateParams({ page: null });
    startTransition(() => router.refresh());
  }

  function handleEditSuccess() {
    setEditPart(null);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? "Qismlar" : "Qismlar qidirish"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Jami: {total} ta qism</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Yangi qism
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:max-w-2xl md:flex-1">
            <Input
              placeholder={isAdmin ? "Qism kodi, nomi yoki brend bo'yicha qidirish..." : "Qism kodi, nomi yoki brend..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isPending && <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ko'rsatish</span>
              <Select
                aria-label="Sahifada ko'rsatiladigan qismlar soni"
                value={String(take)}
                onChange={(e) => updateParams({ take: e.target.value, page: null })}
                className="w-24"
              >
                {TAKE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kod</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Nomi</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Kategoriya</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Brend</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Turi</th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Xarid (¥)</th>
                )}
                <th className="px-4 py-3 text-left font-medium text-gray-500">Sotuv (¥)</th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Ta'minotchi</th>
                )}
                {isAdmin && <th className="px-4 py-3 text-left font-medium text-gray-500" />}
              </tr>
            </thead>
            <tbody className={isPending ? "opacity-60" : ""}>
              {parts.map((part) => (
                <tr key={part.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                    <button
                      type="button"
                      onClick={() => openViewPart(part)}
                      className="rounded-sm text-left font-mono font-semibold text-blue-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {part.code}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{part.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{part.category?.name ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-500">{part.brand ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {PART_TYPES[part.type] ?? part.type}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-gray-700">{formatCny(part.purchasePriceCny)}</td>
                  )}
                  <td className="px-4 py-3 font-medium text-blue-700">
                    {formatCny(part.sellingPriceCny)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-gray-500">{part.supplier?.name ?? "-"}</td>
                  )}
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditPart(part)}
                        >
                          Tahrirlash
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => deletePart(part.id, part.code)}
                        >
                          O'chirish
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!parts.length && (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    {query ? "Qidiruv natijasi topilmadi" : "Qismlar yo'q"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <span>
            {total > 0 ? `${startItem}-${endItem} / ${total}` : "0 / 0"}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isPending}
              onClick={() => updateParams({ page: currentPage - 1 > 1 ? String(currentPage - 1) : null })}
              aria-label="Oldingi sahifa"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-24 text-center text-gray-700">
              {currentPage} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pageCount || isPending}
              onClick={() => updateParams({ page: String(currentPage + 1) })}
              aria-label="Keyingi sahifa"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {isAdmin && (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title="Yangi qism qo'shish"
          className="max-w-3xl"
        >
          <PartForm
            mode="create"
            onSuccess={handleCreateSuccess}
            onCancel={() => setCreateOpen(false)}
            className="space-y-5"
          />
        </Modal>
      )}

      <Modal
        open={Boolean(viewPart)}
        onClose={() => setViewPart(null)}
        title={viewPart ? `Qism: ${viewPart.code}` : "Qism ma'lumotlari"}
        className="max-w-2xl"
      >
        {viewPart && (
          <PartDetails
            part={viewPart}
            isAdmin={isAdmin}
            onImageOpen={() => setImagePreview(viewPart)}
          />
        )}
      </Modal>

      {isAdmin && (
        <Modal
          open={Boolean(editPart)}
          onClose={() => setEditPart(null)}
          title={editPart ? `Qismni tahrirlash: ${editPart.code}` : "Qismni tahrirlash"}
          className="max-w-3xl"
        >
          {editPart && (
            <PartForm
              mode="edit"
              defaultValues={{
                id: editPart.id,
                code: editPart.code,
                name: editPart.name ?? "",
                categoryId: editPart.categoryId ?? "",
                brand: editPart.brand ?? "",
                type: editPart.type,
                purchasePriceCny: editPart.purchasePriceCny?.toString() ?? "",
                wholesalePriceCny: editPart.wholesalePriceCny?.toString() ?? "",
                sellingPriceCny: editPart.sellingPriceCny?.toString() ?? "",
                supplierId: editPart.supplierId ?? "",
                categoryName: editPart.category?.name ?? "",
                supplierName: editPart.supplier?.name ?? "",
                imageUrl: editPart.imageUrl ?? "",
                note: editPart.note ?? "",
              }}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditPart(null)}
              className="space-y-5"
            />
          )}
        </Modal>
      )}

      <Modal
        open={Boolean(imagePreview)}
        onClose={() => setImagePreview(null)}
        title={imagePreview ? `Rasm: ${imagePreview.code}` : "Rasm"}
        className="max-w-4xl"
      >
        {imagePreview?.imageUrl && (
          <div className="rounded-lg bg-gray-50 p-3">
            <img
              src={imagePreview.imageUrl}
              alt={imagePreview.name ?? imagePreview.code}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function PartDetails({
  part,
  isAdmin,
  onImageOpen,
}: {
  part: Part;
  isAdmin: boolean;
  onImageOpen: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Kod" value={part.code} mono />
        <DetailItem label="Nomi" value={part.name} />
        <DetailItem label="Kategoriya" value={part.category?.name} />
        <DetailItem label="Brend" value={part.brand} />
        <DetailItem label="Turi" value={PART_TYPES[part.type] ?? part.type} />
        <DetailItem label="Sotuv narxi" value={formatCny(part.sellingPriceCny)} />
        {isAdmin && <DetailItem label="Xarid narxi" value={formatCny(part.purchasePriceCny)} />}
        {isAdmin && <DetailItem label="Ulgurji narx" value={formatCny(part.wholesalePriceCny)} />}
        {isAdmin && <DetailItem label="Ta'minotchi" value={part.supplier?.name} />}
      </div>

      {part.imageUrl && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Rasm</p>
          <button
            type="button"
            onClick={onImageOpen}
            className="mt-2 flex w-full items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-2 text-left transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <img src={part.imageUrl} alt={part.name ?? part.code} className="size-16 shrink-0 rounded-md border bg-white object-cover" />
            <span>
              <span className="block text-sm font-medium text-gray-800">Rasmni ko'rish</span>
              <span className="mt-1 block text-xs text-gray-500">Kattaroq ko'rish uchun bosing</span>
            </span>
          </button>
        </div>
      )}

      {isAdmin && part.note && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Izoh</p>
          <p className="mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-700">{part.note}</p>
        </div>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={mono ? "mt-1 font-mono text-sm font-semibold text-gray-800" : "mt-1 text-sm text-gray-800"}>
        {value || "—"}
      </p>
    </div>
  );
}

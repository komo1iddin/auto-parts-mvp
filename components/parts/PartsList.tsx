"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { PartModals } from "@/components/parts/PartModals";
import { PartsListHeader } from "@/components/parts/PartsListHeader";
import { PartsListToolbar } from "@/components/parts/PartsListToolbar";
import { PartsPagination } from "@/components/parts/PartsPagination";
import { PartsTable } from "@/components/parts/PartsTable";
import type { Part } from "@/components/parts/types";

interface PartsListProps {
  parts: Part[];
  total: number;
  q: string;
  page: number;
  take: number;
  isAdmin?: boolean;
}

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

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    const href = params.toString() ? `${pathname}?${params}` : pathname;
    startTransition(() => router.replace(href));
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextQuery = query.trim();
      const currentQuery = searchParams.get("q") ?? "";
      if (nextQuery === currentQuery) return;

      updateParams({
        q: nextQuery || null,
        page: null,
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, searchParams, updateParams]);

  async function deletePart(part: Part) {
    if (!confirm(`"${part.code}" qismini o'chirishni tasdiqlaysizmi?`)) return;
    await fetch(`/api/parts/${part.id}`, { method: "DELETE" });
    startTransition(() => router.refresh());
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
      <PartsListHeader
        total={total}
        isAdmin={isAdmin}
        onCreate={() => setCreateOpen(true)}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <PartsListToolbar
          query={query}
          take={take}
          isAdmin={isAdmin}
          isPending={isPending}
          onQueryChange={setQuery}
          onTakeChange={(nextTake) => updateParams({ take: nextTake, page: null })}
        />
        <PartsTable
          parts={parts}
          query={query}
          isAdmin={isAdmin}
          isPending={isPending}
          onView={setViewPart}
          onEdit={setEditPart}
          onDelete={deletePart}
        />
        <PartsPagination
          total={total}
          startItem={startItem}
          endItem={endItem}
          currentPage={currentPage}
          pageCount={pageCount}
          isPending={isPending}
          onPageChange={(nextPage) => updateParams({ page: nextPage ? String(nextPage) : null })}
        />
      </div>

      <PartModals
        isAdmin={isAdmin}
        createOpen={createOpen}
        viewPart={viewPart}
        editPart={editPart}
        imagePreview={imagePreview}
        onCloseCreate={() => setCreateOpen(false)}
        onCloseView={() => setViewPart(null)}
        onCloseEdit={() => setEditPart(null)}
        onCloseImagePreview={() => setImagePreview(null)}
        onCreateSuccess={handleCreateSuccess}
        onEditSuccess={handleEditSuccess}
        onImageOpen={setImagePreview}
      />
    </div>
  );
}

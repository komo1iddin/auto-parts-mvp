"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { PART_TYPES, formatCny } from "@/lib/utils";

interface Part {
  id: string;
  code: string;
  name: string | null;
  brand: string | null;
  type: string;
  sellingPriceCny: string | null;
  imageUrl: string | null;
  category?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  children: Category[];
}

export default function CatalogPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ take: "80" });
    if (q) params.set("q", q);
    if (categoryId) params.set("categoryId", categoryId);
    if (brand) params.set("brand", brand);
    const res = await fetch(`/api/parts?${params}`);
    const data = await res.json();
    setParts(data.parts ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [q, categoryId, brand]);

  useEffect(() => {
    const t = setTimeout(fetchParts, 300);
    return () => clearTimeout(t);
  }, [fetchParts]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? []));
  }, []);

  function flattenCategories(cats: Category[], prefix = ""): { id: string; name: string }[] {
    return cats.flatMap((c) => [
      { id: c.id, name: prefix + c.name },
      ...flattenCategories(c.children ?? [], prefix + c.name + " → "),
    ]);
  }

  const flatCategories = flattenCategories(categories);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-gray-900 text-lg">AutoParts Katalog</div>
          <Link href="/login" className="text-sm text-gray-500 hover:text-blue-600">
            Kirish →
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="🔍 Qism kodi, nomi, brend..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[160px]"
          >
            <option value="">Barcha kategoriyalar</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Brend..."
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
          />
          <button
            onClick={() => { setQ(""); setCategoryId(""); setBrand(""); }}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
          >
            Tozalash
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-500">
          {loading ? "Yuklanmoqda..." : `${total} ta qism topildi`}
        </div>

        {/* Parts grid */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Qism kodi</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Nomi</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Kategoriya</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Brend</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Turi</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Narxi (¥)</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Rasm</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-gray-900">{part.code}</td>
                    <td className="px-4 py-3 text-gray-700">{part.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{part.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{part.brand ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-medium">
                        {PART_TYPES[part.type] ?? part.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatCny(part.sellingPriceCny)}
                    </td>
                    <td className="px-4 py-3">
                      {part.imageUrl ? (
                        <img src={part.imageUrl} alt={part.code} className="h-10 w-10 object-cover rounded-lg border" />
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && !parts.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                      Qidiruv natijasi topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

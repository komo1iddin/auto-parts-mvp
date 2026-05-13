"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SettingOption, SettingOptionKind } from "@/lib/data";

interface SettingsSection {
  kind: SettingOptionKind;
  title: string;
  description: string;
  emptyText: string;
  options: SettingOption[];
}

interface Draft {
  id?: string;
  kind: SettingOptionKind;
  label: string;
  value: string;
  sortOrder: string;
}

export function SettingsOptionsList({ sections }: { sections: SettingsSection[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function refresh() {
    startTransition(() => router.refresh());
  }

  function startCreate(kind: SettingOptionKind) {
    setDraft({ kind, label: "", value: "", sortOrder: "0" });
    setError("");
  }

  function startEdit(option: SettingOption) {
    setDraft({
      id: option.id,
      kind: option.kind,
      label: option.label,
      value: option.value,
      sortOrder: String(option.sortOrder),
    });
    setError("");
  }

  async function saveDraft() {
    if (!draft) return;

    setSaving(true);
    setError("");
    const response = await fetch(draft.id ? `/api/settings/options/${draft.id}` : "/api/settings/options", {
      method: draft.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: draft.kind,
        label: draft.label,
        value: draft.value,
        sortOrder: Number(draft.sortOrder),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "Xatolik yuz berdi");
      setSaving(false);
      return;
    }

    setDraft(null);
    setSaving(false);
    refresh();
  }

  async function deleteOption(option: SettingOption) {
    if (!confirm(`"${option.label}" qiymatini o'chirishni tasdiqlaysizmi?`)) return;

    await fetch(`/api/settings/options/${option.id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sozlamalar</h1>
        <p className="mt-1 text-sm text-gray-500">Qism formalarida ishlatiladigan tanlov ro'yxatlari.</p>
      </div>

      <div className={isPending ? "opacity-60" : ""}>
        {sections.map((section) => (
          <section key={section.kind} className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{section.description}</p>
              </div>
              <Button onClick={() => startCreate(section.kind)}>Qo'shish</Button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Nomi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Qiymat</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Tartib</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {section.options.map((option) => (
                  <tr key={option.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{option.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{option.value}</td>
                    <td className="px-4 py-3 text-gray-500">{option.sortOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => startEdit(option)}>Tahrirlash</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => deleteOption(option)}
                        >
                          O'chirish
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!section.options.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                      {section.emptyText}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              {draft.id ? "Qiymatni tahrirlash" : "Yangi qiymat"}
            </h2>
            <div className="mt-4 space-y-4">
              <Input
                label="Nomi *"
                value={draft.label}
                onChange={(event) => setDraft((current) => current && { ...current, label: event.target.value })}
                placeholder="Masalan: High copy"
              />
              <Input
                label="Qiymat"
                value={draft.value}
                onChange={(event) => setDraft((current) => current && { ...current, value: event.target.value })}
                placeholder="Bo'sh qoldirilsa avtomatik yaratiladi"
              />
              <Input
                label="Tartib"
                type="number"
                value={draft.sortOrder}
                onChange={(event) => setDraft((current) => current && { ...current, sortOrder: event.target.value })}
                placeholder="0"
              />
              {error && (
                <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={saveDraft} disabled={!draft.label.trim() || saving}>
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </Button>
                <Button variant="secondary" onClick={() => setDraft(null)}>Bekor</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

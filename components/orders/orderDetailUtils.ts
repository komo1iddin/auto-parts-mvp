import type { DetailItem, ExportRecord } from "@/components/orders/orderDetailTypes";

export function toNumber(value: DetailItem["purchasePriceCny"]) {
  if (value == null) return 0;
  return Number(value);
}

export function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("uz", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function profitClass(value: number) {
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-500";
}

export function splitChanges(note: string | null) {
  const clean = note?.trim();
  if (!clean) return ["O'zgarish izohi kiritilmagan"];
  return clean.split(";").map((part) => part.trim()).filter(Boolean);
}

export function exportLabel(record: ExportRecord | undefined) {
  if (!record) return undefined;
  const type = record.exportType === "supplier"
    ? `${record.language?.toUpperCase() ?? "CN"} Excel`
    : "Ichki Excel";
  return `${type} • ${formatDateTime(record.createdAt)}`;
}

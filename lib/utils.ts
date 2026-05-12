export function generateOrderNumber(date?: Date): string {
  const d = date || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `Zakaz-${y}${m}${day}`;
}

export function buildOrderNumber(base: string, seq: number, version: number): string {
  const padded = String(seq).padStart(3, "0");
  const num = `${base}-${padded}`;
  return version > 1 ? `${num}-V${version}` : num;
}

export function formatCny(value: number | string | null | undefined): string {
  if (value == null) return "—";
  return `¥${Number(value).toFixed(2)}`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const PART_TYPES: Record<string, string> = {
  original: "Original",
  oem: "OEM",
  copy: "Kopiya",
  analog: "Analog",
};

export const ORDER_STATUSES: Record<string, { label: string; color: string }> = {
  draft: { label: "Qoralama", color: "bg-gray-100 text-gray-700" },
  confirmed: { label: "Tasdiqlangan", color: "bg-green-100 text-green-700" },
  updated: { label: "Yangilangan", color: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Bekor qilingan", color: "bg-red-100 text-red-700" },
};

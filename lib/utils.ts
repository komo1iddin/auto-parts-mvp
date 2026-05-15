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
  aftermarket: "Aftermarket",
  copy: "Copy",
  used: "Used",
  refurbished: "Refurbished",
  analog: "Aftermarket",
};

export const PART_TYPE_STYLES: Record<string, string> = {
  original: "bg-green-100 text-green-700",
  oem: "bg-blue-100 text-blue-700",
  aftermarket: "bg-orange-100 text-orange-700",
  analog: "bg-orange-100 text-orange-700",
  copy: "bg-red-50 text-red-700",
  used: "bg-gray-100 text-gray-700",
  refurbished: "bg-teal-100 text-teal-700",
};

export const ORDER_STATUS_OPTIONS = [
  { value: "draft", label: "Qoralama", color: "bg-gray-100 text-gray-700" },
  { value: "calculating", label: "Hisoblanmoqda", color: "bg-blue-100 text-blue-700" },
  { value: "confirmed", label: "Tasdiqlangan", color: "bg-green-100 text-green-700" },
  { value: "supplier_ordered", label: "Ta'minotchiga berildi", color: "bg-cyan-100 text-cyan-700" },
  { value: "partially_paid", label: "Qisman to'landi", color: "bg-amber-100 text-amber-700" },
  { value: "paid", label: "To'liq to'landi", color: "bg-emerald-100 text-emerald-700" },
  { value: "shipped", label: "Jo'natildi", color: "bg-indigo-100 text-indigo-700" },
  { value: "arrived", label: "Yetib keldi", color: "bg-violet-100 text-violet-700" },
  { value: "closed", label: "Yopildi", color: "bg-gray-200 text-gray-700" },
  { value: "problem", label: "Muammoli", color: "bg-red-100 text-red-700" },
  { value: "updated", label: "Yangilangan", color: "bg-sky-100 text-sky-700" },
  { value: "cancelled", label: "Bekor qilingan", color: "bg-red-100 text-red-700" },
] as const;

export const ORDER_STATUS_KEYS = ORDER_STATUS_OPTIONS.map((status) => status.value);

export const ORDER_EDIT_STATUS_OPTIONS = ORDER_STATUS_OPTIONS.filter(
  (status) => status.value !== "updated" && status.value !== "cancelled"
);

export const ORDER_STATUSES: Record<string, { label: string; color: string }> = Object.fromEntries(
  ORDER_STATUS_OPTIONS.map(({ value, label, color }) => [value, { label, color }])
);

export function isOrderStatus(value: unknown): value is (typeof ORDER_STATUS_KEYS)[number] {
  return typeof value === "string" && ORDER_STATUS_KEYS.includes(value as (typeof ORDER_STATUS_KEYS)[number]);
}

export function isEditableOrderStatus(value: unknown) {
  return typeof value === "string" && ORDER_EDIT_STATUS_OPTIONS.some((status) => status.value === value);
}

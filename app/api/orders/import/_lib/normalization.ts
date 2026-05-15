export function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[№#]/g, "no");
}

export function normalizeCode(value: unknown) {
  return String(value ?? "").trim().replace(/[‐‑‒–—―]/g, "-");
}

export function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function text(value: unknown) {
  return String(value ?? "").trim();
}

export function toNumber(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const withoutCurrency = String(value)
    .replace(/[¥₽$\s]/g, "")
    .replace(/[^\d,.-]/g, "");
  const normalized = withoutCurrency.includes(",") && !withoutCurrency.includes(".")
    ? withoutCurrency.replace(",", ".")
    : withoutCurrency.replace(/,/g, "");

  if (!normalized || normalized === "-" || normalized === ".") return null;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toQuantity(value: unknown) {
  const parsed = toNumber(value);
  return parsed && parsed > 0 ? Math.max(1, Math.floor(parsed)) : 1;
}

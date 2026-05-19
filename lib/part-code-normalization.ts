export function normalizePartCodeAlias(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/[\s\-–—_/\\.]+/g, "");
}


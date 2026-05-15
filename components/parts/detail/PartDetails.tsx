import { PART_TYPES, formatCny } from "@/lib/utils";

export interface PartDetailsData {
  code: string;
  name: string | null;
  brand: string | null;
  type: string;
  purchasePriceCny?: string | number | { toString(): string } | null;
  wholesalePriceCny?: string | number | { toString(): string } | null;
  sellingPriceCny?: string | number | { toString(): string } | null;
  imageUrl: string | null;
  note?: string | null;
  category?: { name: string } | null;
  supplier?: { name: string } | null;
}

export function PartDetails({
  part,
  isAdmin,
  onImageOpen,
}: {
  part: PartDetailsData;
  isAdmin: boolean;
  onImageOpen: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem label="Part number" value={part.code} mono />
        <DetailItem label="Nomi" value={part.name} />
        <DetailItem label="Kategoriya" value={part.category?.name} />
        <DetailItem label="Brend" value={part.brand} />
        <DetailItem label="Quality" value={PART_TYPES[part.type] ?? part.type} />
        <DetailItem label="Sotuv narxi" value={formatCny(part.sellingPriceCny?.toString())} />
        {isAdmin && <DetailItem label="Xarid narxi" value={formatCny(part.purchasePriceCny?.toString())} />}
        {isAdmin && <DetailItem label="Ulgurji narx" value={formatCny(part.wholesalePriceCny?.toString())} />}
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
      <p className={mono ? "mt-1 font-sans text-sm font-semibold tabular-nums text-gray-800" : "mt-1 text-sm text-gray-800"}>
        {value || "—"}
      </p>
    </div>
  );
}

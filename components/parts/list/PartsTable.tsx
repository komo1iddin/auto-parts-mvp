import { Button } from "@/components/ui/Button";
import { PART_TYPES, PART_TYPE_STYLES, formatCny } from "@/lib/utils";
import type { Part } from "@/components/parts/types/parts";

interface PartsTableProps {
  parts: Part[];
  query: string;
  isAdmin: boolean;
  isPending: boolean;
  onView: (part: Part) => void;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
}

export function PartsTable({
  parts,
  query,
  isAdmin,
  isPending,
  onView,
  onEdit,
  onDelete,
}: PartsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-3 text-left font-medium text-gray-500">Part number</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Nomi</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Kategoriya</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Brend</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Quality</th>
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
            <PartsTableRow
              key={part.id}
              part={part}
              isAdmin={isAdmin}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
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
  );
}

function PartsTableRow({
  part,
  isAdmin,
  onView,
  onEdit,
  onDelete,
}: {
  part: Part;
  isAdmin: boolean;
  onView: (part: Part) => void;
  onEdit: (part: Part) => void;
  onDelete: (part: Part) => void;
}) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">
        <button
          type="button"
          onClick={() => onView(part)}
          className="rounded-sm text-left font-mono font-semibold text-blue-700 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {part.code}
        </button>
      </td>
      <td className="px-4 py-3 text-gray-700">{part.name ?? "-"}</td>
      <td className="px-4 py-3 text-gray-500">{part.category?.name ?? "-"}</td>
      <td className="px-4 py-3 text-gray-500">{part.brand ?? "-"}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2 py-0.5 text-xs ${PART_TYPE_STYLES[part.type] ?? "bg-gray-100 text-gray-600"}`}>
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
            <Button variant="ghost" size="sm" onClick={() => onEdit(part)}>
              Tahrirlash
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(part)}
            >
              O'chirish
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}

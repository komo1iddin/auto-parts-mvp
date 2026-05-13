import { ORDER_STATUS_OPTIONS, ORDER_STATUSES } from "@/lib/utils";

interface OrdersListToolbarProps {
  status: string;
  statusCounts?: Record<string, number>;
  search: string;
  isPending: boolean;
  onStatusChange: (status: string) => void;
  onSearchChange: (search: string) => void;
}

export function OrdersListToolbar({
  status,
  statusCounts,
  search,
  isPending,
  onStatusChange,
  onSearchChange,
}: OrdersListToolbarProps) {
  return (
    <div className="space-y-3 border-b border-gray-100 p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="inline-flex flex-wrap gap-0.5 rounded-md bg-muted p-1">
          {["", ...ORDER_STATUS_OPTIONS.map((statusOption) => statusOption.value)].map((option) => {
            const count = statusCounts?.[option];
            return (
              <button
                key={option}
                type="button"
                onClick={() => onStatusChange(option)}
                className={`flex h-8 items-center gap-1.5 rounded-sm px-3 text-xs font-medium transition-colors ${
                  status === option
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {option === "" ? "Barchasi" : ORDER_STATUSES[option]?.label ?? option}
                {count != null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                    status === option ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {isPending && <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>}
      </div>
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Raqam, ta'minotchi yoki yaratuvchi bo'yicha qidirish..."
        className="w-full max-w-sm rounded-md border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
      />
    </div>
  );
}

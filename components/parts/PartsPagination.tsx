import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PartsPaginationProps {
  total: number;
  startItem: number;
  endItem: number;
  currentPage: number;
  pageCount: number;
  isPending: boolean;
  onPageChange: (page: number | null) => void;
}

export function PartsPagination({
  total,
  startItem,
  endItem,
  currentPage,
  pageCount,
  isPending,
  onPageChange,
}: PartsPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
      <span>
        {total > 0 ? `${startItem}-${endItem} / ${total}` : "0 / 0"}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1 || isPending}
          onClick={() => onPageChange(currentPage - 1 > 1 ? currentPage - 1 : null)}
          aria-label="Oldingi sahifa"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-24 text-center text-gray-700">
          {currentPage} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= pageCount || isPending}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Keyingi sahifa"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

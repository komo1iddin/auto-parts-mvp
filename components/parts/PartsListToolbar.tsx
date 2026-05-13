import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const TAKE_OPTIONS = [20, 50, 100];

interface PartsListToolbarProps {
  query: string;
  take: number;
  isAdmin: boolean;
  isPending: boolean;
  onQueryChange: (query: string) => void;
  onTakeChange: (take: string) => void;
}

export function PartsListToolbar({
  query,
  take,
  isAdmin,
  isPending,
  onQueryChange,
  onTakeChange,
}: PartsListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 p-4 md:flex-row md:items-center md:justify-between">
      <div className="w-full md:max-w-2xl md:flex-1">
        <Input
          placeholder={isAdmin ? "Qism kodi, nomi yoki brend bo'yicha qidirish..." : "Qism kodi, nomi yoki brend..."}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {isPending && <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Ko'rsatish</span>
          <Select
            aria-label="Sahifada ko'rsatiladigan qismlar soni"
            value={String(take)}
            onChange={(event) => onTakeChange(event.target.value)}
            className="w-24"
          >
            {TAKE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}

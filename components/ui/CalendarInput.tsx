"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface CalendarInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export function CalendarInput({ label, value, onChange, className }: CalendarInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selected = parseDate(value);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const days = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const nextSelected = parseDate(value);
    if (nextSelected) setViewDate(nextSelected);
  }, [value]);

  useLayoutEffect(() => {
    if (!open) return;

    function positionPopover() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(336, Math.max(288, rect.width));
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openAbove = spaceBelow < 336 && rect.top > spaceBelow;

      setPopoverStyle({
        position: "fixed",
        top: openAbove ? undefined : rect.bottom + 6,
        bottom: openAbove ? window.innerHeight - rect.top + 6 : undefined,
        left: Math.min(rect.left, window.innerWidth - width - 12),
        width,
      });
    }

    positionPopover();
    window.addEventListener("resize", positionPopover);
    window.addEventListener("scroll", positionPopover, true);
    return () => {
      window.removeEventListener("resize", positionPopover);
      window.removeEventListener("scroll", positionPopover, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function moveMonth(delta: number) {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function selectDay(day: Date) {
    onChange(toDateInput(day));
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-1" ref={rootRef}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <button
        type="button"
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-left text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          className
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected ? formatDisplayDate(selected) : "Sana tanlang"}</span>
        <CalendarDays className="size-4 text-gray-500" />
      </button>
      {mounted &&
        open &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="z-[100] rounded-md border border-gray-200 bg-white p-3 text-gray-950 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </div>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" className="size-8 px-0" onClick={() => moveMonth(-1)}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button type="button" size="sm" variant="ghost" className="size-8 px-0" onClick={() => moveMonth(1)}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-500">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {days.map((day) => {
                const currentMonth = day.getMonth() === viewDate.getMonth();
                const active = selected && isSameDay(day, selected);
                const today = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-gray-100",
                      !currentMonth && "text-gray-400",
                      today && "border border-gray-300",
                      active && "bg-gray-950 text-white hover:bg-gray-900"
                    )}
                    onClick={() => selectDay(day)}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                Clear
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => selectDay(new Date())}>
                Today
              </Button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function buildCalendarDays(viewDate: Date) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function parseDate(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("uz", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

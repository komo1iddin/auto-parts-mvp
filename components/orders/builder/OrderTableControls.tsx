"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function TableSelect({
  value,
  onChange,
  options,
  width,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  width: number;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, width });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPosition({
        left: rect.left,
        top: rect.bottom + 8,
        width: Math.max(rect.width, 160),
      });
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };

    updatePosition();
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, width]);

  return (
    <div ref={rootRef} className="relative" style={{ width }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "flex h-8 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-white px-3 text-sm shadow-xs transition-colors outline-none hover:border-gray-300 hover:bg-gray-50",
          "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50"
        )}
      >
        <span className="truncate">{selected?.label ?? "—"}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[80] max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl ring-1 ring-black/10"
          style={{ left: position.left, top: position.top, width: position.width }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-left text-sm text-gray-900 transition-colors hover:bg-gray-100"
            >
              <span>{option.label}</span>
              {option.value === value && <Check className="size-4" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export function TableInput({
  value,
  onChange,
  width,
  center,
  placeholder,
  step = 0.01,
}: {
  value: string | number;
  onChange: (v: string) => void;
  width: number;
  center?: boolean;
  placeholder?: string;
  step?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [focused, value]);

  return (
    <input
      type="number"
      min={0}
      step={step}
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(event.target.value);
      }}
      onFocus={(event) => {
        setFocused(true);
        event.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        setDraft(String(value));
      }}
      placeholder={placeholder ?? "0"}
      className={cn(
        "flex h-8 rounded-md border border-input bg-background px-2 py-0 text-center text-sm shadow-xs transition-colors outline-none [appearance:textfield]",
        "focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50",
        "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        center && "text-center"
      )}
      style={{ width }}
    />
  );
}

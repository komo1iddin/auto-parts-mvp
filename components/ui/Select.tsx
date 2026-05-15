"use client";

import {
  Children,
  SelectHTMLAttributes,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

function getSelectOptions(children: React.ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: React.ReactNode }>(child)) {
      return [];
    }

    if (child.type !== "option") return [];

    const value = String(child.props.value ?? "");
    const label = Children.toArray(child.props.children).join("");
    return [{ value, label, disabled: child.props.disabled }];
  });
}

export function Select({ label, error, className, children, value, defaultValue, onChange, disabled, ...props }: SelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const options = useMemo(() => getSelectOptions(children), [children]);
  const selectedValue = String(value ?? defaultValue ?? "");
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!open) return;

    function positionDropdown() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const maxHeight = Math.max(160, Math.min(256, Math.max(spaceBelow, spaceAbove)));
      const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: "fixed",
        top: openAbove ? undefined : rect.bottom + 4,
        bottom: openAbove ? window.innerHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    }

    positionDropdown();
    window.addEventListener("resize", positionDropdown);
    window.addEventListener("scroll", positionDropdown, true);
    return () => {
      window.removeEventListener("resize", positionDropdown);
      window.removeEventListener("scroll", positionDropdown, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function selectOption(option: SelectOption) {
    if (option.disabled || disabled) return;
    onChange?.({
      target: { value: option.value },
      currentTarget: { value: option.value },
    } as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((current) => !current);
    }
  }

  return (
    <div className="flex flex-col gap-1" ref={rootRef}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-left text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            !selected?.value && "text-muted-foreground",
            error && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
        >
          <span className="truncate">{selected?.label}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </button>
        <select
          tabIndex={-1}
          aria-hidden
          value={selectedValue}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        >
          {children}
        </select>
        {mounted && open && createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            style={dropdownStyle}
            className="z-[100] overflow-auto rounded-md border border-input bg-popover p-1 text-popover-foreground shadow-lg"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === selectedValue}
                disabled={option.disabled}
                onClick={() => selectOption(option)}
                className={cn(
                  "flex min-h-8 w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                  option.value === selectedValue && "bg-accent text-accent-foreground"
                )}
              >
                <Check className={cn("size-4 shrink-0", option.value === selectedValue ? "opacity-100" : "opacity-0")} />
                <span className="truncate">{option.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

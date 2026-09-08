"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export type SelectOption = { label: string; value: string };

/**
 * Dropdown that matches the site's glass styling. A native <select> is styled by
 * the operating system and cannot be themed, so this renders its own listbox and
 * keeps a hidden input in sync for normal form submission.
 */
export function Select({
  name,
  label,
  value,
  defaultValue = "",
  options,
  placeholder = "Choose one",
  onChange,
  className,
  required,
}: {
  name?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  options: (SelectOption | string)[];
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  required?: boolean;
}) {
  const items: SelectOption[] = options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option
  );

  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value : internal;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const selected = items.find((item) => item.value === current);

  function commit(next: string) {
    if (!controlled) setInternal(next);
    onChange?.(next);
    setOpen(false);
  }

  // Close when the pointer goes elsewhere.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  // Open on the current value so the keyboard starts from the right place.
  useEffect(() => {
    if (!open) return;
    const index = items.findIndex((item) => item.value === current);
    setHighlight(index >= 0 ? index : 0);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)?.scrollIntoView({ block: "nearest" });
  }, [highlight, open]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (!open && ["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index - 1 + items.length) % items.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlight(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlight(items.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = items[highlight];
      if (item) commit(item.value);
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={current} required={required} /> : null}

      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-list`}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border bg-ink/60 px-4 text-left text-sm text-white outline-none transition-colors duration-300",
          label ? "pb-2.5 pt-6" : "py-3",
          open ? "border-[var(--accent)]/60" : "border-white/[0.09] hover:border-white/20"
        )}
      >
        {label ? (
          <span className="pointer-events-none absolute left-4 top-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute-soft">
            {label}
          </span>
        ) : null}

        <span className={cn("truncate", selected ? "text-white" : "text-mute-soft")}>
          {selected?.label ?? placeholder}
        </span>

        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 text-mute"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={id}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            data-lenis-prevent
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-60 overflow-y-auto rounded-xl border border-white/[0.12] bg-surface/95 p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,.8)] backdrop-blur-2xl"
          >
            {items.map((item, index) => {
              const active = item.value === current;
              return (
                <li key={item.value} data-index={index}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => commit(item.value)}
                    onMouseEnter={() => setHighlight(index)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors duration-150",
                      highlight === index ? "bg-[var(--accent)]/15 text-white" : "text-mute hover:text-white",
                      active && "text-white"
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {active ? <Check className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

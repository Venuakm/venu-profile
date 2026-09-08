"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Six single-character boxes that behave like one field: typing advances,
 * backspace retreats, and pasting a whole code fills every box at once.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus = true,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function setAt(index: number, char: string) {
    const next = value.padEnd(length, " ").split("");
    next[index] = char;
    const joined = next.join("").replace(/\s/g, "").slice(0, length);
    onChange(joined);
    return joined;
  }

  return (
    <div className={cn("flex justify-between gap-2", className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          value={digit.trim()}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => {
            const char = event.target.value.replace(/\D/g, "").slice(-1);
            if (!char) return;
            const joined = setAt(index, char);
            if (index < length - 1) refs.current[index + 1]?.focus();
            if (joined.length === length) onComplete?.(joined);
          }}
          onKeyDown={(event) => {
            if (event.key === "Backspace") {
              event.preventDefault();
              if (digit.trim()) {
                setAt(index, " ");
              } else if (index > 0) {
                setAt(index - 1, " ");
                refs.current[index - 1]?.focus();
              }
            } else if (event.key === "ArrowLeft" && index > 0) {
              refs.current[index - 1]?.focus();
            } else if (event.key === "ArrowRight" && index < length - 1) {
              refs.current[index + 1]?.focus();
            }
          }}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!pasted) return;
            onChange(pasted);
            refs.current[Math.min(pasted.length, length - 1)]?.focus();
            if (pasted.length === length) onComplete?.(pasted);
          }}
          className={cn(
            "h-13 w-full rounded-xl border bg-ink/60 py-3.5 text-center font-mono text-lg text-white outline-none transition-colors duration-200",
            digit.trim() ? "border-[var(--accent)]/50" : "border-white/[0.1]",
            "focus:border-[var(--accent)] disabled:opacity-50"
          )}
        />
      ))}
    </div>
  );
}

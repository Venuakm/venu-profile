"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "dark" | "light";

const ThemeContext = createContext<{ theme: Theme; setTheme: (theme: Theme) => void; toggle: () => void } | null>(
  null
);

/** Runs before paint so the page never flashes the wrong theme. */
export const themeScript = `(function(){try{var t=localStorage.getItem('vp-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("vp-theme") as Theme | null) ?? null;
    const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setThemeState(stored ?? system);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    localStorage.setItem("vp-theme", next);
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(next);
    root.style.colorScheme = next;
  }, []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}

/** Sliding sun/moon switch. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const light = theme === "light";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      title={light ? "Dark mode" : "Light mode"}
      className={cn(
        "relative grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-white/12 bg-white/[0.04] text-white/80 transition-colors duration-300 hover:border-[var(--accent)]/50 hover:text-[var(--accent)]",
        className
      )}
    >
      <motion.span
        key={theme}
        initial={{ y: light ? -18 : 18, opacity: 0, rotate: light ? -90 : 90 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="grid place-items-center"
      >
        {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </motion.span>
    </button>
  );
}

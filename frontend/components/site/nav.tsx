"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ShieldCheck } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Magnetic, EASE } from "./primitives";
import { ThemeToggle } from "@/components/theme";
import { setScrollLocked } from "./chrome";

export function Nav({ nav }: { nav: SiteContent["nav"] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (value) => setScrolled(value > 40));

  // Highlights the section currently filling the viewport.
  useEffect(() => {
    const ids = nav.links.map((link) => link.href.replace("#", "")).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0.1, 0.5, 1] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [nav.links]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    setScrollLocked(open);
    return () => {
      document.body.style.overflow = "";
      setScrollLocked(false);
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "py-3" : "py-6"
        )}
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div
            className={cn(
              "flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 sm:px-6",
              scrolled ? "glass-strong shadow-[0_20px_60px_-30px_rgba(0,0,0,.9)]" : "border-transparent"
            )}
          >
            <Link href="#home" className="group flex items-center gap-3" aria-label="Home">
              <span className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/12 bg-white/[0.04] font-display text-lg text-white">
                {nav.logoMark}
                <span className="absolute inset-0 rounded-lg border border-[var(--accent)]/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </span>
              <span className="font-display text-lg tracking-[0.18em] text-white">{nav.logoText}</span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {nav.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative rounded-lg px-4 py-2 text-sm transition-colors duration-300",
                    active === link.href ? "text-white" : "text-mute hover:text-white"
                  )}
                >
                  {active === link.href ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.06]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  ) : null}
                  <span className="relative z-10">{link.label}</span>
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              {/* The owner's private door into the dashboard. */}
              <Magnetic strength={0.2} className="hidden sm:block">
                <Link
                  href="/admin/login"
                  data-cursor
                  className="group relative flex items-center gap-2 overflow-hidden rounded-lg border border-[var(--accent)]/45 bg-[var(--accent)]/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:bg-[var(--accent)]"
                  title="Owner sign in"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {nav.adminLabel}
                  <span className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
                </Link>
              </Magnetic>

              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] bg-ink/95 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between px-6 py-6">
              <span className="font-display text-lg tracking-[0.18em] text-white">{nav.logoText}</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-10 flex flex-col gap-2 px-6">
              {nav.links.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.5, ease: EASE }}
                  className="border-b border-white/[0.07] py-5 font-display text-4xl uppercase tracking-tight text-white/85"
                >
                  <span className="mr-4 font-mono text-xs text-[var(--accent)]">0{index + 1}</span>
                  {link.label}
                </motion.a>
              ))}
              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-[var(--accent)]/50 bg-[var(--accent)]/12 py-4 font-mono text-sm uppercase tracking-[0.24em] text-white"
              >
                <ShieldCheck className="h-4 w-4" />
                {nav.adminLabel}
              </Link>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

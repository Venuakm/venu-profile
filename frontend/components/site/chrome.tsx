"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";

/** Inertial scrolling for the whole page. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let frame = 0;
    let cancelled = false;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      lenis?.destroy();
    };
  }, []);

  return null;
}

/** Thin accent bar showing how far down the page you are. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-gradient-to-r from-[var(--accent)] via-[var(--accent-soft)] to-transparent"
    />
  );
}

/** Soft light that follows the pointer, plus a ring that lags behind it. */
export function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setEnabled(true);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let frame = 0;

    const onMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
      const interactive = (event.target as HTMLElement)?.closest("a, button, [data-cursor]");
      ringRef.current?.classList.toggle("scale-[2.1]", Boolean(interactive));
      ringRef.current?.classList.toggle("opacity-90", Boolean(interactive));
    };

    const loop = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      frame = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    frame = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[80] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-[var(--accent)] mix-blend-screen"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[79] -ml-5 -mt-5 h-10 w-10 rounded-full border border-white/25 opacity-50 transition-[transform,opacity] duration-300 ease-out"
      />
    </>
  );
}

/** Drifting orbs, a rotating ring and a scan line behind the whole page. */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 grid-lines" />

      <motion.div
        className="absolute -left-40 top-[-10%] h-[38rem] w-[38rem] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 26%, transparent), transparent 70%)" }}
        animate={{ x: [0, 90, -40, 0], y: [0, 60, 120, 0], scale: [1, 1.12, 0.95, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-12%] top-[35%] h-[32rem] w-[32rem] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, rgba(90,120,255,.18), transparent 70%)" }}
        animate={{ x: [0, -70, 30, 0], y: [0, -80, 40, 0], scale: [1, 0.9, 1.15, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.05]"
        animate={{ rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--accent)] shadow-[0_0_24px_6px_var(--accent)]" />
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.06]"
        animate={{ rotate: -360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[var(--accent)]/[0.05] to-transparent" />
      <div
        className="absolute inset-x-0 h-40 opacity-[0.07]"
        style={{
          background: "linear-gradient(180deg, transparent, var(--accent), transparent)",
          animation: "scan 9s linear infinite",
        }}
      />
    </div>
  );
}

/** Full-screen intro that counts to 100 and lifts away. */
export function Preloader({ name }: { name: string }) {
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (sessionStorage.getItem("vp_intro_seen")) {
      setDone(true);
      return;
    }
    const start = performance.now();
    const duration = 1500;
    let frame = 0;
    const tick = (now: number) => {
      const ratio = Math.min((now - start) / duration, 1);
      setProgress(Math.round(ratio * 100));
      if (ratio < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        sessionStorage.setItem("vp_intro_seen", "1");
        setTimeout(() => setDone(true), 260);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ y: "-100%", transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
        >
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-5xl tracking-tight text-white sm:text-7xl"
          >
            {name}
          </motion.span>
          <div className="mt-8 h-px w-56 overflow-hidden bg-white/10 sm:w-72">
            <motion.div
              className="h-full bg-[var(--accent)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.1 }}
            />
          </div>
          <span className="mt-4 font-mono text-xs tracking-[0.3em] text-mute">{progress}%</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

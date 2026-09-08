"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/cn";

export const EASE = [0.16, 1, 0.3, 1] as const;

/** Fades and lifts children into view once, when they are scrolled to. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.85, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Splits a line into words and staggers them upward from a mask. */
export function RevealText({
  text,
  className,
  wordClassName,
  delay = 0,
  once = true,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  once?: boolean;
}) {
  const words = text.split(" ");
  return (
    <span className={cn("inline-flex flex-wrap", className)}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="overflow-hidden inline-flex">
          <motion.span
            className={cn("inline-block will-change-transform", wordClassName)}
            initial={{ y: "110%", opacity: 0 }}
            whileInView={{ y: "0%", opacity: 1 }}
            viewport={{ once, margin: "-60px" }}
            transition={{ duration: 0.8, delay: delay + index * 0.045, ease: EASE }}
          >
            {word}
            {index < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Section label + heading pairing used across the page. */
export function SectionHeading({
  kicker,
  heading,
  subheading,
  align = "left",
  id,
}: {
  kicker: string;
  heading: string;
  subheading?: string;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")} id={id}>
      <Reveal>
        <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
          <span className="h-px w-10 bg-[var(--accent)]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.32em] text-[var(--accent)]">{kicker}</span>
        </div>
      </Reveal>
      <h2 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
        <RevealText text={heading} />
      </h2>
      {subheading ? (
        <Reveal delay={0.12}>
          <p className="mt-5 text-base leading-relaxed text-mute sm:text-lg">{subheading}</p>
        </Reveal>
      ) : null}
    </div>
  );
}

/** Button that leans toward the cursor while hovered. */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 15, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 180, damping: 15, mass: 0.4 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
        y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Card that tilts in 3D toward the pointer and lights up where it points. */
export function TiltCard({
  children,
  className,
  max = 8,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 160, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 160, damping: 18 });
  const glowX = useTransform(px, (value) => `${value * 100}%`);
  const glowY = useTransform(py, (value) => `${value * 100}%`);

  return (
    <motion.div
      ref={ref}
      className={cn("relative [transform-style:preserve-3d]", className)}
      style={{ rotateX, rotateY }}
      onMouseMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        px.set((event.clientX - rect.left) / rect.width);
        py.set((event.clientY - rect.top) / rect.height);
      }}
      onMouseLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [glowX, glowY] as unknown as MotionValue<string>[],
            ([gx, gy]) =>
              `radial-gradient(340px circle at ${gx} ${gy}, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)`
          ),
        }}
      />
      {children}
    </motion.div>
  );
}

/** Counts up to a number when it scrolls into view. */
export function Counter({ value, duration = 1.6 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const target = Number(String(value).replace(/[^0-9.]/g, "")) || 0;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || target === 0) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      // easeOutExpo - fast start, gentle landing
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  return <span ref={ref}>{target === 0 ? value : display}</span>;
}

/** Infinite horizontal ticker. */
export function Marquee({
  items,
  className,
  reverse = false,
}: {
  items: string[];
  className?: string;
  reverse?: boolean;
}) {
  const doubled = [...items, ...items];
  return (
    <div className={cn("relative flex overflow-hidden", className)}>
      <div
        className="flex shrink-0 items-center gap-10 whitespace-nowrap will-change-transform"
        style={{
          animation: `marquee ${items.length * 4.5}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {doubled.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10">
            <span className="font-display text-2xl uppercase tracking-wide text-white/25 sm:text-3xl">{item}</span>
            <span className="h-1.5 w-1.5 rotate-45 bg-[var(--accent)]" />
          </span>
        ))}
      </div>
    </div>
  );
}

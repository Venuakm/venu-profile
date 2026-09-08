"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight, MapPin } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { Counter, EASE, Magnetic, Marquee } from "./primitives";

/** Types out each role, holds, deletes, moves to the next. */
function RoleTicker({ roles }: { roles: string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!roles.length) return;
    const current = roles[index % roles.length];
    const complete = text === current;

    if (!deleting && complete) {
      const hold = setTimeout(() => setDeleting(true), 1900);
      return () => clearTimeout(hold);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((value) => (value + 1) % roles.length);
      return;
    }

    const timer = setTimeout(
      () => setText(deleting ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1)),
      deleting ? 34 : 68
    );
    return () => clearTimeout(timer);
  }, [text, deleting, index, roles]);

  return (
    <span className="text-[var(--accent)]">
      {text}
      <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-[var(--accent)]" />
    </span>
  );
}

/**
 * Pinned to the viewport, not to the hero section - the section is taller than
 * the screen, so an absolutely positioned cue ends up sitting on the marquee.
 * It fades out as soon as scrolling starts, since it has done its job by then.
 */
function ScrollCue() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 160], [1, 0]);
  const y = useTransform(scrollY, [0, 160], [0, 20]);

  return (
    <motion.a
      href="#about"
      aria-label="Scroll to about"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.8 }}
      className="fixed bottom-7 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-2 text-mute lg:flex"
    >
      <motion.span style={{ opacity, y }} className="flex flex-col items-center gap-2">
        <span className="rounded-full bg-ink/70 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.28em] backdrop-blur-sm">
          scroll
        </span>
        <motion.span animate={{ y: [0, 7, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
          <ArrowDown className="h-4 w-4" />
        </motion.span>
      </motion.span>
    </motion.a>
  );
}

export function Hero({ hero, marquee }: { hero: SiteContent["hero"]; marquee: string[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const nameY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, -90]);

  const letters = `${hero.firstName} `.split("");

  return (
    <section ref={ref} id="home" className="relative min-h-screen overflow-hidden pt-32 sm:pt-36">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
        <motion.div style={{ y: nameY, opacity: fade }} className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.8, ease: EASE }}
            className="flex flex-wrap items-center gap-4"
          >
            {hero.availability?.open ? (
              <span className="relative flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animation: "pulse-ring 2.4s ease-out infinite" }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-300">
                  {hero.availability.label}
                </span>
              </span>
            ) : null}
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
              <MapPin className="h-3.5 w-3.5" />
              {hero.location}
            </span>
          </motion.div>

          {/* The name: the loudest thing on the page. */}
          <h1 className="mt-7 font-display leading-[0.86] tracking-[-0.02em]">
            <span className="sr-only">
              {hero.firstName} {hero.lastName}
            </span>
            <span aria-hidden className="block text-[clamp(3.4rem,13vw,11rem)] text-white">
              {letters.map((letter, index) => (
                <motion.span
                  key={`${letter}-${index}`}
                  className="inline-block will-change-transform"
                  initial={{ y: "115%", opacity: 0, rotateX: -60 }}
                  animate={{ y: "0%", opacity: 1, rotateX: 0 }}
                  transition={{ delay: 0.5 + index * 0.055, duration: 0.95, ease: EASE }}
                >
                  {letter === " " ? " " : letter}
                </motion.span>
              ))}
            </span>
            <motion.span
              aria-hidden
              initial={{ y: "115%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              transition={{ delay: 0.78, duration: 1, ease: EASE }}
              className="block text-[clamp(3.4rem,13vw,11rem)] text-[var(--accent)] text-glow"
            >
              {hero.lastName}
            </motion.span>
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.8 }}
            className="mt-6 flex items-center gap-4"
          >
            <span className="h-px w-12 bg-[var(--accent)]" />
            <p className="font-mono text-sm uppercase tracking-[0.2em] text-white/90 sm:text-base">
              <RoleTicker roles={hero.roleRotation?.length ? hero.roleRotation : [hero.kicker]} />
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.8, ease: EASE }}
            className="mt-7 max-w-xl text-base leading-relaxed text-mute sm:text-lg"
          >
            {hero.tagline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.28, duration: 0.8, ease: EASE }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Magnetic>
              <a
                href={hero.primaryCta?.href ?? "#work"}
                data-cursor
                className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-[var(--accent)] px-7 py-4 text-sm font-semibold tracking-wide text-white accent-glow"
              >
                <span className="relative z-10">{hero.primaryCta?.label}</span>
                <ArrowUpRight className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href={hero.secondaryCta?.href ?? "#contact"}
                data-cursor
                className="flex items-center gap-3 rounded-xl border border-white/15 px-7 py-4 text-sm font-semibold tracking-wide text-white transition-colors duration-300 hover:border-white/40 hover:bg-white/[0.05]"
              >
                {hero.secondaryCta?.label}
              </a>
            </Magnetic>
            {hero.resumeUrl ? (
              <a
                href={hero.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-mute underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Download resume
              </a>
            ) : null}
          </motion.div>
        </motion.div>

        {/* Portrait with orbiting frame */}
        <motion.div style={{ y: portraitY }} className="relative z-10 mx-auto w-full max-w-md lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 1.1, ease: EASE }}
            className="relative aspect-[4/5] w-full"
          >
            <div className="absolute inset-0 -rotate-3 rounded-[28px] border border-[var(--accent)]/30" />
            <div className="absolute inset-0 rotate-2 rounded-[28px] border border-white/10" />
            <div className="relative h-full w-full overflow-hidden rounded-[24px] glass">
              <Image
                src={hero.portrait || "/placeholders/portrait.svg"}
                alt={`${hero.firstName} ${hero.lastName}`}
                fill
                priority
                sizes="(max-width: 1024px) 90vw, 440px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              <div className="pointer-events-none absolute inset-0 shimmer opacity-30" />
            </div>

            <motion.div
              className="absolute -right-5 -top-5 grid h-20 w-20 place-items-center rounded-full border border-white/12 glass"
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/70">open</span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Stats strip */}
      {hero.stats?.length ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.9, ease: EASE }}
          className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8"
        >
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.05] sm:grid-cols-4">
            {hero.stats.map((stat) => (
              <div key={stat.label} className="group bg-ink-soft/80 p-5 backdrop-blur-xl transition-colors duration-300 hover:bg-[var(--accent)]/[0.07] sm:p-6">
                <div className="font-display text-3xl text-white sm:text-4xl">
                  <Counter value={stat.value} />
                  <span className="text-[var(--accent)]">{stat.suffix}</span>
                </div>
                <div className="mt-1.5 text-xs leading-snug text-mute sm:text-[13px]">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      ) : null}

      {marquee.length ? (
        <div className="relative z-10 mt-14 border-y border-white/[0.07] bg-white/[0.015] py-5">
          <Marquee items={marquee} />
        </div>
      ) : null}

      <ScrollCue />
    </section>
  );
}

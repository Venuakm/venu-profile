"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Check, GraduationCap, Sparkles, Trophy } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { EASE, Reveal, SectionHeading, TiltCard } from "./primitives";

export function About({ about }: { about: SiteContent["about"] }) {
  return (
    <section id="about" className="relative z-10 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker={about.kicker} heading={about.heading} />

        <div className="mt-16 grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <div className="group relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="absolute -inset-3 rounded-3xl border border-white/[0.07]" />
              <motion.div
                className="absolute -inset-3 rounded-3xl border border-[var(--accent)]/25"
                animate={{ rotate: [0, 1.5, 0, -1.5, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="relative aspect-square overflow-hidden rounded-2xl glass">
                <Image
                  src={about.portrait || "/placeholders/about.svg"}
                  alt="Portrait"
                  fill
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              </div>
            </div>
          </Reveal>

          <div>
            <div className="prose-venu">
              {about.paragraphs?.map((paragraph, index) => (
                <Reveal key={index} delay={index * 0.08}>
                  <p className="text-[15px] leading-[1.85] text-mute sm:text-base">{paragraph}</p>
                </Reveal>
              ))}
            </div>

            {about.highlights?.length ? (
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {about.highlights.map((item, index) => (
                  <Reveal key={item} delay={0.1 + index * 0.06}>
                    <div className="group flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition-colors duration-300 hover:border-[var(--accent)]/35 hover:bg-[var(--accent)]/[0.05]">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-[var(--accent)]/50 text-[var(--accent)]">
                        <Check className="h-3 w-3" />
                      </span>
                      <span className="text-sm leading-relaxed text-white/75">{item}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Experience({ experience }: { experience: SiteContent["experience"] }) {
  const [open, setOpen] = useState<string | null>(experience.items?.[0]?.id ?? null);

  return (
    <section id="experience" className="relative z-10 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker={experience.kicker} heading={experience.heading} />

        <div className="relative mt-16">
          {/* Timeline spine */}
          <div className="absolute left-[15px] top-2 hidden h-full w-px bg-gradient-to-b from-[var(--accent)]/60 via-white/10 to-transparent sm:block" />

          <div className="space-y-5">
            {experience.items?.map((item, index) => {
              const expanded = open === item.id;
              return (
                <Reveal key={item.id ?? index} delay={index * 0.08}>
                  <div className="relative sm:pl-14">
                    <span
                      className={cn(
                        "absolute left-0 top-7 hidden h-8 w-8 place-items-center rounded-full border transition-colors duration-300 sm:grid",
                        item.current
                          ? "border-[var(--accent)] bg-[var(--accent)]/15"
                          : "border-white/12 bg-ink-soft"
                      )}
                    >
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          item.current ? "bg-[var(--accent)]" : "bg-white/35"
                        )}
                      />
                      {item.current ? (
                        <span
                          className="absolute inset-0 rounded-full border border-[var(--accent)]/60"
                          style={{ animation: "pulse-ring 2.6s ease-out infinite" }}
                        />
                      ) : null}
                    </span>

                    <button
                      type="button"
                      onClick={() => setOpen(expanded ? null : item.id)}
                      className={cn(
                        "group w-full rounded-2xl border p-5 text-left transition-all duration-400 sm:p-7",
                        expanded
                          ? "border-[var(--accent)]/30 bg-white/[0.045]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.035]"
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink">
                            <Image
                              src={item.logo || "/placeholders/logo-kas.svg"}
                              alt={item.company}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </span>
                          <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                              <h3 className="font-display text-xl tracking-wide text-white sm:text-2xl">
                                {item.company}
                              </h3>
                              {item.current ? (
                                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300">
                                  current
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-white/70">{item.role}</p>
                            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.16em] text-mute-soft">
                              {item.period}
                              {item.location ? ` - ${item.location}` : ""}
                            </p>
                          </div>
                        </div>
                        <motion.span
                          animate={{ rotate: expanded ? 45 : 0 }}
                          transition={{ duration: 0.35, ease: EASE }}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/12 text-white/70 group-hover:border-[var(--accent)]/50 group-hover:text-[var(--accent)]"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </motion.span>
                      </div>

                      {item.summary ? (
                        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-mute">{item.summary}</p>
                      ) : null}

                      <motion.div
                        initial={false}
                        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
                        transition={{ duration: 0.45, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-5 space-y-2.5 border-t border-white/[0.07] pt-5">
                          {item.bullets?.map((bullet, bulletIndex) => (
                            <li key={bulletIndex} className="flex gap-3 text-sm leading-relaxed text-mute">
                              <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-[var(--accent)]" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </motion.div>

                      {item.stack?.length ? (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {item.stack.map((tech) => (
                            <span
                              key={tech}
                              className="rounded-md border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/60"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Skills({ skills }: { skills: SiteContent["skills"] }) {
  return (
    <section id="skills" className="relative z-10 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker={skills.kicker} heading={skills.heading} />

        <div className="mt-16 grid gap-5 sm:grid-cols-2">
          {skills.groups?.map((group, groupIndex) => (
            <Reveal key={group.title} delay={groupIndex * 0.08}>
              <TiltCard className="group h-full" max={5}>
                <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.022] p-6 backdrop-blur-sm transition-colors duration-300 hover:border-white/[0.16] sm:p-7">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                    <h3 className="font-mono text-xs uppercase tracking-[0.24em] text-white/80">{group.title}</h3>
                  </div>

                  <div className="mt-6 space-y-4">
                    {group.items?.map((skill, skillIndex) => (
                      <div key={skill.name}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-white/80">{skill.name}</span>
                          <span className="font-mono text-[10px] text-mute-soft">{skill.level}%</span>
                        </div>
                        <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.07]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)]"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${skill.level}%` }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 1.1, delay: 0.1 + skillIndex * 0.05, ease: EASE }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Education({ education }: { education: SiteContent["education"] }) {
  return (
    <section id="education" className="relative z-10 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker={education.kicker} heading={education.heading} />

        <div className="mt-16 grid gap-5 lg:grid-cols-2">
          {education.items?.map((item, index) => (
            <Reveal key={item.school} delay={index * 0.08}>
              <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.022] p-7 transition-colors duration-300 hover:border-[var(--accent)]/25">
                <GraduationCap className="h-6 w-6 text-[var(--accent)]" />
                <h3 className="mt-5 font-display text-2xl tracking-wide text-white">{item.school}</h3>
                <p className="mt-1.5 text-sm text-white/75">{item.degree}</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-mute-soft">{item.period}</p>
                {item.detail ? <p className="mt-4 text-sm leading-relaxed text-mute">{item.detail}</p> : null}
              </div>
            </Reveal>
          ))}

          {education.achievements?.length ? (
            <Reveal delay={0.12}>
              <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.022] p-7">
                <Trophy className="h-6 w-6 text-[var(--accent)]" />
                <h3 className="mt-5 font-display text-2xl tracking-wide text-white">Achievements</h3>
                <ul className="mt-5 space-y-3">
                  {education.achievements.map((achievement) => (
                    <li key={achievement} className="flex gap-3 text-sm leading-relaxed text-mute">
                      <span className="mt-2 h-1 w-1 shrink-0 rotate-45 bg-[var(--accent)]" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

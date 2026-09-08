"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Github, Globe } from "lucide-react";
import type { Project, SiteContent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { EASE, Reveal, SectionHeading, TiltCard } from "./primitives";

export function Work({ work, projects }: { work: SiteContent["work"]; projects: Project[] }) {
  const tags = ["All", ...Array.from(new Set(projects.flatMap((project) => project.tags ?? [])))];
  const [filter, setFilter] = useState("All");

  const visible = filter === "All" ? projects : projects.filter((project) => project.tags?.includes(filter));

  return (
    <section id="work" className="relative z-10 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading kicker={work.kicker} heading={work.heading} subheading={work.subheading} />

          {tags.length > 2 ? (
            <Reveal delay={0.15}>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFilter(tag)}
                    className={cn(
                      "relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300",
                      filter === tag ? "text-white" : "text-mute hover:text-white"
                    )}
                  >
                    {filter === tag ? (
                      <motion.span
                        layoutId="work-filter"
                        className="absolute inset-0 rounded-full border border-[var(--accent)]/45 bg-[var(--accent)]/12"
                        transition={{ type: "spring", stiffness: 340, damping: 28 }}
                      />
                    ) : (
                      <span className="absolute inset-0 rounded-full border border-white/[0.09]" />
                    )}
                    <span className="relative z-10">{tag}</span>
                  </button>
                ))}
              </div>
            </Reveal>
          ) : null}
        </div>

        <motion.div layout className="mt-14 grid gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible.map((project, index) => (
              <motion.div
                key={project._id ?? project.slug}
                layout
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.6, delay: index * 0.06, ease: EASE }}
                className={cn(index === 0 && visible.length > 2 ? "md:col-span-2" : "")}
              >
                <ProjectCard project={project} large={index === 0 && visible.length > 2} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {!visible.length ? (
          <p className="mt-14 rounded-2xl border border-dashed border-white/12 p-12 text-center text-mute">
            No projects here yet. Add them from the admin dashboard.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ProjectCard({ project, large }: { project: Project; large?: boolean }) {
  return (
    <TiltCard className="group h-full" max={large ? 4 : 7}>
      <Link
        href={`/work/${project.slug}`}
        data-cursor
        className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] transition-colors duration-400 hover:border-[var(--accent)]/35"
      >
        <div className={cn("relative overflow-hidden", large ? "aspect-[21/9]" : "aspect-[16/10]")}>
          <Image
            src={project.cover || "/placeholders/project-cover.svg"}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />

          {project.featured ? (
            <span className="absolute left-4 top-4 rounded-full border border-[var(--accent)]/45 bg-ink/70 px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--accent)] backdrop-blur">
              featured
            </span>
          ) : null}
          {project.year ? (
            <span className="absolute right-4 top-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
              {project.year}
            </span>
          ) : null}
        </div>

        <div className="relative flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl tracking-wide text-white sm:text-3xl">{project.title}</h3>
              {project.tagline ? <p className="mt-1.5 text-sm text-[var(--accent)]">{project.tagline}</p> : null}
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/12 text-white/70 transition-all duration-300 group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>

          {project.summary ? (
            <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-mute">{project.summary}</p>
          ) : null}

          {project.metrics?.length ? (
            <div className="mt-6 flex flex-wrap gap-5">
              {project.metrics.slice(0, 3).map((metric) => (
                <div key={metric.label}>
                  <div className="font-display text-lg text-white">{metric.value}</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute-soft">{metric.label}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
            {project.stack?.slice(0, large ? 8 : 4).map((tech) => (
              <span
                key={tech}
                className="rounded-md border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/55"
              >
                {tech}
              </span>
            ))}
            <span className="ml-auto flex gap-2">
              {project.links?.github ? <Github className="h-4 w-4 text-mute-soft" /> : null}
              {project.links?.live ? <Globe className="h-4 w-4 text-mute-soft" /> : null}
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

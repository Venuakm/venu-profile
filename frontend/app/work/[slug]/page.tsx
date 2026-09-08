import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github, Globe } from "lucide-react";
import { fetchPublic } from "@/lib/api";
import { fallbackContent } from "@/lib/fallback";
import type { Project, SiteContent } from "@/lib/types";
import { Reveal, RevealText } from "@/components/site/primitives";
import { AmbientBackground, CursorGlow, ScrollProgress, SmoothScroll } from "@/components/site/chrome";
import { Footer } from "@/components/site/contact";

export const revalidate = 20;

async function getProject(slug: string) {
  const [projectResponse, contentResponse] = await Promise.all([
    fetchPublic<{ project: Project }>(`/api/projects/${slug}`, 20),
    fetchPublic<{ content: SiteContent }>("/api/content", 20),
  ]);
  return { project: projectResponse?.project ?? null, content: contentResponse?.content ?? fallbackContent };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { project } = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: { title: project.title, description: project.summary, images: [project.cover] },
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { project, content } = await getProject(slug);
  if (!project) notFound();

  const accent = project.accent || content.theme?.accent || "#e11d2a";
  const paragraphs = (project.description || project.summary).split(/\n\s*\n/).filter(Boolean);

  const links = [
    { label: "Visit live site", href: project.links?.live, icon: Globe },
    { label: "View source", href: project.links?.github, icon: Github },
    { label: "Read case study", href: project.links?.caseStudy, icon: ArrowUpRight },
  ].filter((link) => link.href);

  return (
    <main
      className="relative min-h-screen"
      style={{ "--accent": accent, "--accent-soft": content.theme?.accentGlow ?? accent } as React.CSSProperties}
    >
      <SmoothScroll />
      <ScrollProgress />
      <CursorGlow />
      <AmbientBackground />

      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
        <Reveal>
          <Link
            href="/#work"
            className="inline-flex items-center gap-2 text-sm text-mute transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All work
          </Link>
        </Reveal>

        <header className="mt-10">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              {project.year ? (
                <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--accent)]">
                  {project.year}
                </span>
              ) : null}
              {project.tags?.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.09] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mute"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>

          <h1 className="mt-5 font-display text-[clamp(2.6rem,8vw,5.5rem)] leading-[0.95] tracking-tight text-white">
            <RevealText text={project.title} />
          </h1>

          {project.tagline ? (
            <Reveal delay={0.12}>
              <p className="mt-4 text-lg text-[var(--accent)]">{project.tagline}</p>
            </Reveal>
          ) : null}
        </header>

        <Reveal delay={0.16}>
          <div className="relative mt-12 aspect-[16/9] overflow-hidden rounded-2xl border border-white/[0.09]">
            <Image
              src={project.cover || "/placeholders/project-cover.svg"}
              alt={project.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_280px]">
          <div className="prose-venu">
            {paragraphs.map((paragraph, index) => (
              <Reveal key={index} delay={index * 0.06}>
                <p className="text-[15px] leading-[1.9] text-mute sm:text-base">{paragraph}</p>
              </Reveal>
            ))}
          </div>

          <aside className="space-y-6">
            {project.role ? (
              <Reveal>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-soft">Role</p>
                  <p className="mt-1.5 text-sm text-white/85">{project.role}</p>
                </div>
              </Reveal>
            ) : null}

            {project.stack?.length ? (
              <Reveal delay={0.08}>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-soft">Built with</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {project.stack.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-md border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-white/65"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ) : null}

            {project.metrics?.length ? (
              <Reveal delay={0.14}>
                <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5">
                  {project.metrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="font-display text-2xl text-white">{metric.value}</div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mute-soft">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {links.length ? (
              <Reveal delay={0.2}>
                <div className="space-y-2">
                  {links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-white/[0.09] px-4 py-3 text-sm text-white/85 transition-colors hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/[0.06]"
                      >
                        <Icon className="h-4 w-4 text-[var(--accent)]" />
                        {link.label}
                      </a>
                    );
                  })}
                </div>
              </Reveal>
            ) : null}
          </aside>
        </div>

        {project.gallery?.length > 1 ? (
          <div className="mt-16 grid gap-5 sm:grid-cols-2">
            {project.gallery.map((image, index) => (
              <Reveal key={image + index} delay={index * 0.06}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.09]">
                  <Image
                    src={image}
                    alt={`${project.title} screenshot ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}

        <Reveal delay={0.1}>
          <div className="mt-20 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/[0.09] bg-white/[0.022] p-7">
            <div>
              <p className="font-display text-2xl tracking-wide text-white">Have something similar in mind?</p>
              <p className="mt-1.5 text-sm text-mute">I&apos;m open to new work - tell me about it.</p>
            </div>
            <Link
              href="/#contact"
              className="group flex items-center gap-2.5 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white accent-glow"
            >
              Get in touch
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>

      <Footer
        footer={content.footer}
        socials={content.socials}
        name={`${content.hero?.firstName ?? ""} ${content.hero?.lastName ?? ""}`.trim()}
      />
    </main>
  );
}

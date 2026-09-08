import type { Metadata } from "next";
import { fetchPublic } from "@/lib/api";
import { fallbackContent } from "@/lib/fallback";
import type { Project, SiteContent } from "@/lib/types";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { About, Education, Experience, Skills } from "@/components/site/sections";
import { Work } from "@/components/site/work";
import { Contact, Footer } from "@/components/site/contact";
import { AmbientBackground, CursorGlow, Preloader, ScrollProgress, SmoothScroll } from "@/components/site/chrome";

export const revalidate = 20;

async function getData() {
  const [contentResponse, projectResponse] = await Promise.all([
    fetchPublic<{ content: SiteContent }>("/api/content", 20),
    fetchPublic<{ projects: Project[] }>("/api/projects", 20),
  ]);

  return {
    content: contentResponse?.content ?? fallbackContent,
    projects: projectResponse?.projects ?? [],
    live: Boolean(contentResponse),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { content } = await getData();
  return {
    title: content.meta?.title,
    description: content.meta?.description,
    keywords: content.meta?.keywords,
    openGraph: {
      title: content.meta?.title,
      description: content.meta?.description,
      images: content.meta?.ogImage ? [content.meta.ogImage] : undefined,
    },
  };
}

export default async function HomePage() {
  const { content, projects } = await getData();
  const accent = content.theme?.accent ?? "#e11d2a";
  const accentSoft = content.theme?.accentGlow ?? "#ff2b3d";

  const marquee = Array.from(
    new Set(content.skills?.groups?.flatMap((group) => group.items.map((item) => item.name)) ?? [])
  ).slice(0, 14);

  return (
    <main
      className="relative min-h-screen"
      style={{ "--accent": accent, "--accent-soft": accentSoft } as React.CSSProperties}
    >
      <Preloader name={content.hero?.firstName ?? "VENU"} />
      <SmoothScroll />
      <ScrollProgress />
      {content.theme?.cursorGlow !== false ? <CursorGlow /> : null}
      {content.theme?.animatedBackground !== false ? <AmbientBackground /> : null}

      <Nav nav={content.nav} />
      <Hero hero={content.hero} marquee={marquee} />
      <About about={content.about} />
      <Experience experience={content.experience} />
      <Work work={content.work} projects={projects} />
      <Skills skills={content.skills} />
      <Education education={content.education} />
      <Contact contact={content.contact} socials={content.socials} />
      <Footer
        footer={content.footer}
        socials={content.socials}
        name={`${content.hero?.firstName ?? ""} ${content.hero?.lastName ?? ""}`.trim()}
      />
    </main>
  );
}

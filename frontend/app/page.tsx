import type { Metadata } from "next";
import { fetchPublic } from "@/lib/api";
import { fallbackContent } from "@/lib/fallback";
import { nameKeywords, personJsonLd } from "@/lib/seo";
import { absoluteUrl, displayName, siteUrl } from "@/lib/site";
import type { Project, SiteContent } from "@/lib/types";
import { Nav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { About, Education, Experience, Skills } from "@/components/site/sections";
import { Work } from "@/components/site/work";
import { Contact, Footer } from "@/components/site/contact";
import { JsonLd } from "@/components/site/json-ld";
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
  const name = displayName(content.hero?.firstName, content.hero?.lastName);
  const title = content.meta?.title || `${name} | Full Stack Developer`;
  const description =
    content.meta?.description ||
    `Official website of ${name}, Full Stack Developer. Next.js, Node.js and MongoDB.`;
  const ogImages = content.meta?.ogImage ? [absoluteUrl(content.meta.ogImage)] : undefined;

  return {
    title,
    description,
    keywords: nameKeywords(content),
    authors: [{ name, url: siteUrl() }],
    alternates: { canonical: siteUrl() },
    openGraph: {
      type: "profile",
      url: siteUrl(),
      siteName: name,
      title,
      description,
      images: ogImages,
      firstName: content.hero?.firstName,
      lastName: content.hero?.lastName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages,
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

      <JsonLd data={personJsonLd(content)} />
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

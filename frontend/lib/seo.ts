import type { SiteContent } from "./types";
import { absoluteUrl, displayName, siteUrl } from "./site";

export function personJsonLd(content: SiteContent) {
  const name = displayName(content.hero?.firstName, content.hero?.lastName);
  const sameAs = (content.socials ?? [])
    .map((item) => item.url)
    .filter((url) => url && !url.startsWith("mailto:"));
  const school = content.education?.items?.[0]?.school;
  const image = content.hero?.portrait || content.meta?.ogImage;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}/#website`,
        url: siteUrl(),
        name,
        description: content.meta?.description,
        inLanguage: "en",
        publisher: { "@id": `${siteUrl()}/#person` },
      },
      {
        "@type": "Person",
        "@id": `${siteUrl()}/#person`,
        name,
        givenName: content.hero?.firstName,
        familyName: content.hero?.lastName,
        url: siteUrl(),
        jobTitle: content.hero?.kicker || "Full Stack Developer",
        email: content.contact?.email ? `mailto:${content.contact.email}` : undefined,
        telephone: content.contact?.phone || undefined,
        image: image ? absoluteUrl(image) : undefined,
        address: content.contact?.location
          ? { "@type": "PostalAddress", addressCountry: "IN", addressLocality: content.contact.location }
          : undefined,
        alumniOf: school ? { "@type": "CollegeOrUniversity", name: school } : undefined,
        sameAs,
      },
    ],
  };
}

export function nameKeywords(content: SiteContent): string[] {
  const name = displayName(content.hero?.firstName, content.hero?.lastName);
  return Array.from(
    new Set(
      [
        name,
        "Venu Akkamgari",
        "Venu Akkamgari portfolio",
        "Venu Akkamgari developer",
        "Akkamgari Venu",
        ...(content.meta?.keywords ?? []),
      ].filter(Boolean)
    )
  );
}

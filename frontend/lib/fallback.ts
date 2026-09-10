import type { SiteContent } from "./types";

/**
 * Used only when the API is unreachable, so the site still renders something
 * sensible during a cold start or a database blip.
 */
export const fallbackContent: SiteContent = {
  meta: {
    title: "Venu Akkamgari | Full Stack Developer",
    description:
      "Official website of Venu Akkamgari, Full Stack Developer and NIT Uttarakhand CSE graduate.",
    keywords: ["Venu Akkamgari", "Venu Akkamgari portfolio", "Full Stack Developer"],
    ogImage: "/placeholders/og.svg",
  },
  theme: {
    accent: "#e11d2a",
    accentGlow: "#ff2b3d",
    background: "#07080b",
    surface: "#0e1015",
    grain: true,
    cursorGlow: true,
    animatedBackground: true,
  },
  nav: {
    logoText: "VENU",
    logoMark: "V",
    links: [
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
      { label: "Experience", href: "#experience" },
      { label: "Work", href: "#work" },
      { label: "Skills", href: "#skills" },
      { label: "Contact", href: "#contact" },
    ],
    adminLabel: "I'MU",
  },
  hero: {
    kicker: "Full Stack Developer",
    firstName: "VENU",
    lastName: "AKKAMGARI",
    roleRotation: ["Full Stack Developer"],
    tagline: "Building commerce platforms that stay fast at scale.",
    availability: { open: true, label: "Available for select work" },
    location: "India - Remote friendly",
    primaryCta: { label: "View my work", href: "#work" },
    secondaryCta: { label: "Get in touch", href: "#contact" },
    portrait: "/placeholders/portrait.svg",
    resumeUrl: "",
    stats: [],
  },
  about: { kicker: "About", heading: "", portrait: "/placeholders/about.svg", paragraphs: [], highlights: [] },
  experience: { kicker: "Experience", heading: "", items: [] },
  work: { kicker: "Work", heading: "", subheading: "" },
  skills: { kicker: "Skills", heading: "", groups: [] },
  education: { kicker: "Education", heading: "", items: [], achievements: [] },
  contact: {
    kicker: "Contact",
    heading: "Let's build something",
    subheading: "",
    email: "venuakkamgari@gmail.com",
    phone: "",
    location: "",
    responseTime: "",
    availability: "",
    formNote: "",
    subjects: ["Full-time role", "Freelance project", "Collaboration"],
  },
  socials: [],
  footer: { note: "", copyright: "Venu Akkamgari", backToTop: "Back to top" },
};

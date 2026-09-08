export type Cta = { label: string; href: string };

export type SiteContent = {
  meta: { title: string; description: string; keywords: string[]; ogImage: string };
  theme: {
    accent: string;
    accentGlow: string;
    background: string;
    surface: string;
    grain: boolean;
    cursorGlow: boolean;
    animatedBackground: boolean;
  };
  nav: { logoText: string; logoMark: string; links: Cta[]; adminLabel: string };
  hero: {
    kicker: string;
    firstName: string;
    lastName: string;
    roleRotation: string[];
    tagline: string;
    availability: { open: boolean; label: string };
    location: string;
    primaryCta: Cta;
    secondaryCta: Cta;
    portrait: string;
    resumeUrl: string;
    stats: { value: string; suffix: string; label: string }[];
  };
  about: {
    kicker: string;
    heading: string;
    portrait: string;
    paragraphs: string[];
    highlights: string[];
  };
  experience: {
    kicker: string;
    heading: string;
    items: ExperienceItem[];
  };
  work: { kicker: string; heading: string; subheading: string };
  skills: { kicker: string; heading: string; groups: SkillGroup[] };
  education: {
    kicker: string;
    heading: string;
    items: { school: string; degree: string; period: string; detail: string }[];
    achievements: string[];
  };
  contact: {
    kicker: string;
    heading: string;
    subheading: string;
    email: string;
    phone: string;
    location: string;
    responseTime: string;
    availability: string;
    formNote: string;
    subjects: string[];
  };
  socials: { label: string; url: string; icon: string }[];
  footer: { note: string; copyright: string; backToTop: string };
};

export type ExperienceItem = {
  id: string;
  company: string;
  role: string;
  period: string;
  current: boolean;
  location: string;
  summary: string;
  stack: string[];
  bullets: string[];
  logo: string;
  link: string;
};

export type SkillGroup = {
  title: string;
  items: { name: string; level: number }[];
};

export type Project = {
  _id: string;
  title: string;
  slug: string;
  tagline: string;
  summary: string;
  description: string;
  cover: string;
  gallery: string[];
  tags: string[];
  stack: string[];
  role: string;
  year: string;
  metrics: { label: string; value: string }[];
  links: { live: string; github: string; caseStudy: string };
  featured: boolean;
  published: boolean;
  order: number;
  accent?: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
  budget: string;
  status: "new" | "read" | "replied" | "archived";
  starred: boolean;
  ip: string;
  userAgent: string;
  replies: { body: string; sentAt: string; delivered: boolean }[];
  createdAt: string;
};

export type Notification = {
  _id: string;
  type: "message" | "auth" | "content" | "project" | "system" | "media";
  level: "info" | "success" | "warning" | "critical";
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

export type MediaItem = {
  _id: string;
  filename: string;
  originalName: string;
  url: string;
  mime: string;
  size: number;
  alt: string;
  folder: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  lastLoginAt?: string | null;
};

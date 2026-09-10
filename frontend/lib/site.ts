/** Canonical origin for metadata, sitemap and JSON-LD. */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_ENV === "production") return "https://venuakkamgari.dev";
  return "http://localhost:3010";
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = siteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function displayName(first?: string, last?: string): string {
  return `${first ?? "Venu"} ${last ?? "Akkamgari"}`.replace(/\s+/g, " ").trim();
}

/**
 * Generates the placeholder artwork shipped with the site. Every image is an SVG
 * so it stays sharp, tiny and themeable until real assets are uploaded.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "placeholders");
const ACCENT = "#e11d2a";

const wrap = (w, h, inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none">${inner}</svg>`;

const defs = `
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0d0f14"/>
    <stop offset="1" stop-color="#07080b"/>
  </linearGradient>
  <radialGradient id="glow" cx="50%" cy="35%" r="60%">
    <stop offset="0" stop-color="${ACCENT}" stop-opacity=".38"/>
    <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
  </radialGradient>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
    <path d="M40 0H0V40" stroke="rgba(255,255,255,.05)" stroke-width="1"/>
  </pattern>
</defs>`;

const base = (w, h) =>
  `${defs}<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#grid)"/><rect width="${w}" height="${h}" fill="url(#glow)"/>`;

const project = (w, h, label, index) => {
  const cx = w / 2;
  const cy = h / 2;
  return wrap(
    w,
    h,
    `${base(w, h)}
    <circle cx="${cx}" cy="${cy}" r="${h * 0.28}" stroke="${ACCENT}" stroke-opacity=".55" stroke-width="1.5"/>
    <circle cx="${cx}" cy="${cy}" r="${h * 0.2}" stroke="rgba(255,255,255,.16)" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${h * 0.36}" stroke="rgba(255,255,255,.06)" stroke-width="1" stroke-dasharray="6 10"/>
    <text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="rgba(255,255,255,.9)"
      font-family="Arial Black, Arial, sans-serif" font-size="${h * 0.13}" letter-spacing="2">0${index}</text>
    <text x="40" y="${h - 40}" fill="rgba(255,255,255,.5)" font-family="Arial, sans-serif"
      font-size="15" letter-spacing="4">${label.toUpperCase()}</text>
    <rect x="40" y="40" width="52" height="3" fill="${ACCENT}"/>`
  );
};

const portrait = wrap(
  680,
  860,
  `${base(680, 860)}
  <circle cx="340" cy="300" r="130" fill="rgba(255,255,255,.06)" stroke="${ACCENT}" stroke-opacity=".5"/>
  <circle cx="340" cy="262" r="58" fill="rgba(255,255,255,.14)"/>
  <path d="M232 430c0-62 48-112 108-112s108 50 108 112" fill="rgba(255,255,255,.14)"/>
  <circle cx="340" cy="300" r="190" stroke="rgba(255,255,255,.08)" stroke-dasharray="4 12"/>
  <text x="340" y="640" text-anchor="middle" fill="rgba(255,255,255,.45)" font-family="Arial, sans-serif"
    font-size="17" letter-spacing="7">YOUR PHOTO HERE</text>
  <text x="340" y="672" text-anchor="middle" fill="rgba(255,255,255,.25)" font-family="Arial, sans-serif"
    font-size="13" letter-spacing="2">Upload from the admin dashboard</text>`
);

const about = wrap(
  760,
  760,
  `${base(760, 760)}
  <rect x="120" y="120" width="520" height="520" rx="18" stroke="${ACCENT}" stroke-opacity=".45"/>
  <rect x="160" y="160" width="440" height="440" rx="12" stroke="rgba(255,255,255,.12)"/>
  <circle cx="380" cy="330" r="86" fill="rgba(255,255,255,.1)"/>
  <path d="M262 480c0-64 53-116 118-116s118 52 118 116" fill="rgba(255,255,255,.1)"/>
  <text x="380" y="600" text-anchor="middle" fill="rgba(255,255,255,.4)" font-family="Arial, sans-serif"
    font-size="16" letter-spacing="6">ABOUT IMAGE</text>`
);

const og = wrap(
  1200,
  630,
  `${base(1200, 630)}
  <text x="80" y="300" fill="#ffffff" font-family="Arial Black, Arial, sans-serif" font-size="96" letter-spacing="-2">VENU</text>
  <text x="80" y="390" fill="${ACCENT}" font-family="Arial Black, Arial, sans-serif" font-size="96" letter-spacing="-2">AKKAMGARI</text>
  <text x="84" y="450" fill="rgba(255,255,255,.6)" font-family="Arial, sans-serif" font-size="24" letter-spacing="6">FULL STACK DEVELOPER</text>
  <rect x="80" y="180" width="70" height="5" fill="${ACCENT}"/>`
);

const logo = (name, letters) =>
  wrap(
    120,
    120,
    `<rect width="120" height="120" rx="26" fill="#0e1015" stroke="rgba(255,255,255,.1)"/>
     <circle cx="60" cy="60" r="34" stroke="${ACCENT}" stroke-opacity=".6"/>
     <text x="60" y="70" text-anchor="middle" fill="#fff" font-family="Arial Black, Arial, sans-serif" font-size="26">${letters}</text>`
  );

const favicon = wrap(
  64,
  64,
  `<rect width="64" height="64" rx="14" fill="#07080b"/>
   <path d="M16 18l16 32 16-32" stroke="${ACCENT}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`
);

const files = {
  "portrait.svg": portrait,
  "about.svg": about,
  "og.svg": og,
  "project-cover.svg": project(1200, 800, "Project", 0),
  "project-1.svg": project(1200, 800, "MySELLerCENTRAL", 1),
  "project-2.svg": project(1200, 800, "ZestFindz", 2),
  "project-3.svg": project(1200, 800, "Boostopia", 3),
  "project-4.svg": project(1200, 800, "ESHOP", 4),
  "project-5.svg": project(1200, 800, "Note-Zipper", 5),
  "logo-zestfindz.svg": logo("ZestFindz", "ZF"),
  "logo-kas.svg": logo("KAS Commerce", "KAS"),
  "logo-boostopia.svg": logo("Boostopia", "B"),
};

await mkdir(OUT, { recursive: true });
await Promise.all(Object.entries(files).map(([name, svg]) => writeFile(path.join(OUT, name), svg, "utf8")));
await writeFile(path.join(process.cwd(), "public", "favicon.svg"), favicon, "utf8");

console.log(`Wrote ${Object.keys(files).length + 1} placeholder assets.`);

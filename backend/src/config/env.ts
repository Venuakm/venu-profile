import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const isProd = process.env.NODE_ENV === "production";

export const env = {
  isProd,
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? "0.0.0.0",

  mongoUri: required("MONGODB_URI"),
  mongoDbName: process.env.MONGODB_DB ?? "venu_profile",

  // Auth
  jwtSecret: required("JWT_SECRET"),
  refreshSecret: required("REFRESH_TOKEN_SECRET"),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
  cookieSecret: required("COOKIE_SECRET"),
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,

  // Brute-force protection
  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS ?? 8),
  lockoutMinutes: Number(process.env.LOCKOUT_MINUTES ?? 15),

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  // Seed admin
  adminEmail: process.env.ADMIN_EMAIL ?? "venuakkamgari@gmail.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminName: process.env.ADMIN_NAME ?? "Venu Akkamgari",

  // Mail
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    // Gmail displays app passwords in four spaced groups, but rejects the spaces.
    pass: (process.env.SMTP_PASS ?? "").replace(/\s+/g, ""),
    from: process.env.MAIL_FROM ?? "Venu Portfolio <no-reply@venu.dev>",
    to: process.env.MAIL_TO ?? process.env.ADMIN_EMAIL ?? "venuakkamgari@gmail.com",
  },

  cloudinary: {
    // Copy-pasted keys often carry stray whitespace, which Cloudinary rejects
    // with a confusing "Invalid api_key" rather than a format error.
    cloudName: (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim(),
    apiKey: (process.env.CLOUDINARY_API_KEY ?? "").replace(/\s+/g, ""),
    apiSecret: (process.env.CLOUDINARY_API_SECRET ?? "").replace(/\s+/g, ""),
    folder: (process.env.CLOUDINARY_FOLDER ?? "venu-profile").trim(),
  },

  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  siteUrl: process.env.SITE_URL ?? "http://localhost:3000",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB ?? 8),
};

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { Admin } from "../models/Admin.js";

export const ACCESS_COOKIE = "vp_at";
export const REFRESH_COOKIE = "vp_rt";
export const REFRESH_PATH = "/api/auth";

const baseCookie = {
  httpOnly: true as const,
  secure: env.isProd,
  sameSite: (env.isProd ? "strict" : "lax") as "strict" | "lax",
  domain: env.cookieDomain,
  signed: false,
};

export function setAccessCookie(reply: FastifyReply, token: string) {
  reply.setCookie(ACCESS_COOKIE, token, { ...baseCookie, path: "/", maxAge: 60 * 60 });
}

export function setRefreshCookie(reply: FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE, token, {
    ...baseCookie,
    path: REFRESH_PATH,
    maxAge: 60 * 60 * 24 * env.refreshTokenTtlDays,
  });
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie(ACCESS_COOKIE, { ...baseCookie, path: "/" });
  reply.clearCookie(REFRESH_COOKIE, { ...baseCookie, path: REFRESH_PATH });
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function newOpaqueToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}

/**
 * Issues a rotating refresh token. Tokens are stored hashed so a database leak
 * cannot be replayed against the API.
 */
export async function issueRefreshToken(
  adminId: string,
  meta: { ip: string; userAgent: string },
  replacedHash?: string
): Promise<string> {
  const token = newOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    admin: adminId,
    tokenHash,
    ip: meta.ip,
    userAgent: meta.userAgent,
    expiresAt,
  });
  if (replacedHash) {
    await RefreshToken.updateOne(
      { tokenHash: replacedHash },
      { $set: { revokedAt: new Date(), replacedByHash: tokenHash } }
    );
  }
  return token;
}

export async function revokeAllSessions(adminId: string) {
  await RefreshToken.updateMany(
    { admin: adminId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

declare module "fastify" {
  interface FastifyRequest {
    admin?: { id: string; email: string; name: string; role: string };
  }
}

/** Route guard: requires a valid, unexpired access token cookie (or Bearer). */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const bearer = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    const token = request.cookies?.[ACCESS_COOKIE] ?? bearer;
    if (!token) return reply.code(401).send({ error: "Authentication required" });

    const payload = request.server.jwt.verify<{
      sub: string;
      email: string;
      name: string;
      role: string;
      iat: number;
    }>(token);

    const admin = await Admin.findById(payload.sub).lean();
    if (!admin) return reply.code(401).send({ error: "Account no longer exists" });

    // A password change invalidates every token minted before it.
    if (admin.passwordChangedAt && payload.iat * 1000 < new Date(admin.passwordChangedAt).getTime()) {
      return reply.code(401).send({ error: "Session expired, please sign in again" });
    }

    request.admin = {
      id: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role ?? "owner",
    };
  } catch {
    return reply.code(401).send({ error: "Invalid or expired session" });
  }
}

/**
 * Double-submit style CSRF guard. Cookies are SameSite, and every mutating
 * request must also carry a header a cross-site form cannot set.
 */
export async function requireCsrfHeader(request: FastifyRequest, reply: FastifyReply) {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return;
  if (request.headers["x-requested-with"] !== "venu-admin") {
    return reply.code(403).send({ error: "Missing request signature" });
  }
}

export function registerJwt(app: FastifyInstance) {
  return { secret: env.jwtSecret, sign: { expiresIn: env.accessTokenTtl } };
}

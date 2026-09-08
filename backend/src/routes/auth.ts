import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";
import { RefreshToken } from "../models/RefreshToken.js";
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  hashToken,
  issueRefreshToken,
  requireAuth,
  revokeAllSessions,
  setAccessCookie,
  setRefreshCookie,
} from "../plugins/auth.js";
import { notify } from "../lib/notify.js";

const loginSchema = z.object({
  // Accepts either the account email or its username.
  email: z.string().min(3).max(200),
  password: z.string().min(8).max(200),
});

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

export async function authRoutes(app: FastifyInstance) {
  /** Sign in. Rate limited, with per-account lockout after repeated failures. */
  app.post(
    "/login",
    {
      config: {
        rateLimit: { max: 8, timeWindow: "15 minutes" },
      },
    },
    async (request, reply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Enter your username or email and password" });
      }
      const { email, password } = parsed.data;
      const ip = request.ip;
      const userAgent = String(request.headers["user-agent"] ?? "");

      const identifier = email.toLowerCase().trim();
      const admin = await Admin.findOne({ $or: [{ email: identifier }, { username: identifier }] });

      // Constant-ish response regardless of whether the account exists.
      if (!admin) {
        await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        const minutes = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
        return reply
          .code(423)
          .send({ error: `Account locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` });
      }

      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (!valid) {
        admin.failedAttempts += 1;
        if (admin.failedAttempts >= env.maxLoginAttempts) {
          admin.lockedUntil = new Date(Date.now() + env.lockoutMinutes * 60 * 1000);
          admin.failedAttempts = 0;
          await notify({
            type: "auth",
            level: "critical",
            title: "Account locked after failed sign-ins",
            body: `${env.maxLoginAttempts} failed attempts from ${ip}.`,
            meta: { ip, userAgent },
          });
        }
        await admin.save();
        return reply.code(401).send({ error: "Invalid credentials" });
      }

      admin.failedAttempts = 0;
      admin.lockedUntil = null;
      admin.lastLoginAt = new Date();
      admin.lastLoginIp = ip;
      await admin.save();

      const accessToken = app.jwt.sign({
        sub: String(admin._id),
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
      const refreshToken = await issueRefreshToken(String(admin._id), { ip, userAgent });

      setAccessCookie(reply, accessToken);
      setRefreshCookie(reply, refreshToken);

      await notify({
        type: "auth",
        level: "info",
        title: "Signed in to the dashboard",
        body: `From ${ip}`,
        meta: { ip, userAgent },
      });

      return {
        admin: { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role, avatar: admin.avatar },
      };
    }
  );

  /** Rotates the refresh token. Reuse of a revoked token kills every session. */
  app.post("/refresh", { config: { rateLimit: { max: 60, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const token = request.cookies?.[REFRESH_COOKIE];
    if (!token) return reply.code(401).send({ error: "No session" });

    const tokenHash = hashToken(token);
    const stored = await RefreshToken.findOne({ tokenHash });

    if (!stored) {
      clearAuthCookies(reply);
      return reply.code(401).send({ error: "Session not recognised" });
    }

    if (stored.revokedAt || stored.expiresAt < new Date()) {
      // Replayed token: assume theft and drop all sessions for the account.
      await revokeAllSessions(String(stored.admin));
      clearAuthCookies(reply);
      await notify({
        type: "auth",
        level: "critical",
        title: "Session replay detected",
        body: "A revoked refresh token was reused. All sessions were signed out.",
        meta: { ip: request.ip },
      });
      return reply.code(401).send({ error: "Session expired" });
    }

    const admin = await Admin.findById(stored.admin);
    if (!admin) {
      clearAuthCookies(reply);
      return reply.code(401).send({ error: "Account no longer exists" });
    }

    const nextRefresh = await issueRefreshToken(
      String(admin._id),
      { ip: request.ip, userAgent: String(request.headers["user-agent"] ?? "") },
      tokenHash
    );
    const accessToken = app.jwt.sign({
      sub: String(admin._id),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    setAccessCookie(reply, accessToken);
    setRefreshCookie(reply, nextRefresh);

    return {
      admin: { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role, avatar: admin.avatar },
    };
  });

  app.get("/me", { preHandler: requireAuth }, async (request) => {
    const admin = await Admin.findById(request.admin!.id).lean();
    return {
      admin: {
        id: request.admin!.id,
        email: request.admin!.email,
        name: request.admin!.name,
        role: request.admin!.role,
        avatar: admin?.avatar ?? "",
        lastLoginAt: admin?.lastLoginAt ?? null,
      },
    };
  });

  app.post("/logout", async (request, reply) => {
    const token = request.cookies?.[REFRESH_COOKIE];
    if (token) {
      await RefreshToken.updateOne({ tokenHash: hashToken(token) }, { $set: { revokedAt: new Date() } });
    }
    clearAuthCookies(reply);
    return { ok: true };
  });

  app.post("/logout-all", { preHandler: requireAuth }, async (request, reply) => {
    await revokeAllSessions(request.admin!.id);
    clearAuthCookies(reply);
    return { ok: true };
  });

  app.get("/sessions", { preHandler: requireAuth }, async (request) => {
    const sessions = await RefreshToken.find({ admin: request.admin!.id, revokedAt: null })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return {
      sessions: sessions.map((s) => ({
        id: String(s._id),
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
    };
  });

  app.post("/change-password", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid password" });
    }

    const admin = await Admin.findById(request.admin!.id);
    if (!admin) return reply.code(404).send({ error: "Account not found" });

    const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
    if (!valid) return reply.code(401).send({ error: "Current password is incorrect" });

    admin.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    admin.passwordChangedAt = new Date();
    await admin.save();
    await revokeAllSessions(String(admin._id));
    clearAuthCookies(reply);

    await notify({
      type: "auth",
      level: "warning",
      title: "Password changed",
      body: "All sessions were signed out.",
    });

    return { ok: true, message: "Password updated. Please sign in again." };
  });

  app.patch("/profile", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1).max(120).optional(),
      avatar: z.string().max(500).optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid profile data" });

    const admin = await Admin.findByIdAndUpdate(request.admin!.id, { $set: parsed.data }, { new: true }).lean();
    return { admin: { id: String(admin?._id), name: admin?.name, email: admin?.email, avatar: admin?.avatar } };
  });
}

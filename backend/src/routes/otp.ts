import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";
import { OTP_PURPOSES } from "../models/OtpCode.js";
import { issueOtp, verifyOtp } from "../lib/otp.js";
import { notify } from "../lib/notify.js";
import { issueRefreshToken, requireAuth, revokeAllSessions, setAccessCookie, setRefreshCookie, clearAuthCookies } from "../plugins/auth.js";

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

const usernameSchema = z
  .string()
  .min(3, "Usernames need at least 3 characters")
  .max(40)
  .regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dots, dashes and underscores only");

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return "your email";
  const head = name.slice(0, 2);
  return `${head}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

export async function otpRoutes(app: FastifyInstance) {
  /**
   * Step 1 of code sign-in. Always answers the same way whether or not the
   * account exists, so this cannot be used to discover valid usernames.
   */
  app.post(
    "/otp/request",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const schema = z.object({ identifier: z.string().min(3).max(200) });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Enter your username or email" });

      const identifier = parsed.data.identifier.toLowerCase().trim();
      const admin = await Admin.findOne({ $or: [{ email: identifier }, { username: identifier }] });

      const generic = {
        ok: true,
        message: "If that account exists, a code is on its way.",
        maskedEmail: admin ? maskEmail(admin.email) : undefined,
      };

      if (!admin) return generic;

      if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        return reply.code(423).send({ error: "Account is temporarily locked. Try again shortly." });
      }

      await issueOtp(admin, "login", {
        ip: request.ip,
        userAgent: String(request.headers["user-agent"] ?? ""),
      });

      await notify({
        type: "auth",
        title: "Sign-in code requested",
        body: `A one-time code was emailed after a request from ${request.ip}.`,
      });

      return generic;
    }
  );

  /** Step 2 of code sign-in: verify and open a session. */
  app.post(
    "/otp/verify",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const schema = z.object({
        identifier: z.string().min(3).max(200),
        code: z.string().min(4).max(10),
      });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Enter the 6-digit code" });

      const identifier = parsed.data.identifier.toLowerCase().trim();
      const admin = await Admin.findOne({ $or: [{ email: identifier }, { username: identifier }] });
      if (!admin) return reply.code(401).send({ error: "That code is not valid" });

      const result = await verifyOtp(admin._id, "login", parsed.data.code);
      if (!result.ok) return reply.code(401).send({ error: result.error });

      admin.failedAttempts = 0;
      admin.lockedUntil = null;
      admin.lastLoginAt = new Date();
      admin.lastLoginIp = request.ip;
      await admin.save();

      const accessToken = app.jwt.sign({
        sub: String(admin._id),
        email: admin.email,
        name: admin.name,
        role: admin.role,
      });
      const refreshToken = await issueRefreshToken(String(admin._id), {
        ip: request.ip,
        userAgent: String(request.headers["user-agent"] ?? ""),
      });

      setAccessCookie(reply, accessToken);
      setRefreshCookie(reply, refreshToken);

      await notify({
        type: "auth",
        level: "success",
        title: "Signed in with an email code",
        body: `From ${request.ip}`,
      });

      return {
        admin: { id: String(admin._id), email: admin.email, name: admin.name, role: admin.role, avatar: admin.avatar },
      };
    }
  );

  /**
   * Sends a code before a sensitive change. Requires an active session, so only
   * the signed-in owner can trigger it.
   */
  app.post(
    "/otp/challenge",
    { preHandler: requireAuth, config: { rateLimit: { max: 6, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const schema = z.object({ purpose: z.enum(OTP_PURPOSES) });
      const parsed = schema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "Unknown verification purpose" });
      if (parsed.data.purpose === "login") {
        return reply.code(400).send({ error: "Use /otp/request for sign-in codes" });
      }

      const admin = await Admin.findById(request.admin!.id);
      if (!admin) return reply.code(404).send({ error: "Account not found" });

      await issueOtp(admin, parsed.data.purpose, {
        ip: request.ip,
        userAgent: String(request.headers["user-agent"] ?? ""),
      });

      return { ok: true, maskedEmail: maskEmail(admin.email), expiresInMinutes: 10 };
    }
  );

  /** Password change: current password AND an emailed code. */
  app.post("/secure/change-password", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: passwordSchema,
      code: z.string().min(4).max(10),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    }

    const admin = await Admin.findById(request.admin!.id);
    if (!admin) return reply.code(404).send({ error: "Account not found" });

    const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
    if (!valid) return reply.code(401).send({ error: "Current password is incorrect" });

    const otp = await verifyOtp(admin._id, "change-password", parsed.data.code);
    if (!otp.ok) return reply.code(401).send({ error: otp.error });

    admin.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    admin.passwordChangedAt = new Date();
    await admin.save();
    await revokeAllSessions(String(admin._id));
    clearAuthCookies(reply);

    await notify({
      type: "auth",
      level: "warning",
      title: "Password changed",
      body: `Verified by email code from ${request.ip}. All sessions were signed out.`,
    });

    return { ok: true, message: "Password updated. Please sign in again." };
  });

  /** Username change: password AND an emailed code. */
  app.post("/secure/change-username", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      username: usernameSchema,
      currentPassword: z.string().min(1),
      code: z.string().min(4).max(10),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    }

    const admin = await Admin.findById(request.admin!.id);
    if (!admin) return reply.code(404).send({ error: "Account not found" });

    const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
    if (!valid) return reply.code(401).send({ error: "Password is incorrect" });

    const otp = await verifyOtp(admin._id, "change-username", parsed.data.code);
    if (!otp.ok) return reply.code(401).send({ error: otp.error });

    const username = parsed.data.username.toLowerCase();
    const taken = await Admin.findOne({ username, _id: { $ne: admin._id } });
    if (taken) return reply.code(409).send({ error: "That username is already taken" });

    const previous = admin.username;
    admin.username = username;
    await admin.save();

    await notify({
      type: "auth",
      level: "warning",
      title: "Username changed",
      body: `${previous ?? "(none)"} -> ${username}, verified by email code.`,
    });

    return { ok: true, username };
  });

  /** Account email change: password AND a code sent to the *current* address. */
  app.post("/secure/change-email", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      email: z.string().email().max(200),
      currentPassword: z.string().min(1),
      code: z.string().min(4).max(10),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    }

    const admin = await Admin.findById(request.admin!.id);
    if (!admin) return reply.code(404).send({ error: "Account not found" });

    const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
    if (!valid) return reply.code(401).send({ error: "Password is incorrect" });

    const otp = await verifyOtp(admin._id, "change-email", parsed.data.code);
    if (!otp.ok) return reply.code(401).send({ error: otp.error });

    const email = parsed.data.email.toLowerCase();
    const taken = await Admin.findOne({ email, _id: { $ne: admin._id } });
    if (taken) return reply.code(409).send({ error: "That email is already in use" });

    const previous = admin.email;
    admin.email = email;
    await admin.save();

    await notify({
      type: "auth",
      level: "critical",
      title: "Account email changed",
      body: `${previous} -> ${email}. Codes now go to the new address.`,
    });

    return { ok: true, email };
  });

  /** Lets the dashboard show the current username and OTP settings. */
  app.get("/security", { preHandler: requireAuth }, async (request) => {
    const admin = await Admin.findById(request.admin!.id).lean();
    return {
      username: admin?.username ?? "",
      email: admin?.email ?? "",
      otp: {
        deliversTo: admin?.email ? maskEmail(admin.email) : "",
        emailConfigured: Boolean(env.smtp.host && env.smtp.user),
        codeLength: 6,
        expiresInMinutes: 10,
      },
    };
  });
}

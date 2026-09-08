import crypto from "node:crypto";
import { OtpCode, type OtpPurpose } from "../models/OtpCode.js";
import { escapeHtml, sendMail } from "./mailer.js";
import { notify } from "./notify.js";

const CODE_LENGTH = 6;
const TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const LABELS: Record<OtpPurpose, string> = {
  login: "sign in to your dashboard",
  "change-password": "change your password",
  "change-username": "change your username",
  "change-email": "change your account email",
};

function generateCode(): string {
  // randomInt is uniform - no modulo bias, unlike Math.random or % 10.
  return Array.from({ length: CODE_LENGTH }, () => crypto.randomInt(0, 10)).join("");
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Issues a one-time code and emails it. Any code previously issued for the same
 * purpose is invalidated first, so only the newest one ever works.
 */
export async function issueOtp(
  admin: { _id: unknown; email: string; name: string },
  purpose: OtpPurpose,
  meta: { ip: string; userAgent: string }
): Promise<{ expiresAt: Date }> {
  await OtpCode.updateMany(
    { admin: admin._id, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

  await OtpCode.create({
    admin: admin._id,
    purpose,
    codeHash: hashCode(code),
    expiresAt,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  await sendMail({
    to: admin.email,
    subject: `${code} is your verification code`,
    html: otpTemplate(code, purpose, meta.ip),
    text: `Your code is ${code}. It expires in ${TTL_MINUTES} minutes. If this wasn't you, ignore this email and change your password.`,
  });

  return { expiresAt };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; error: string; locked?: boolean };

/** Consumes a code. Wrong guesses count, and the code dies after five. */
export async function verifyOtp(
  adminId: unknown,
  purpose: OtpPurpose,
  code: string
): Promise<VerifyResult> {
  const record = await OtpCode.findOne({ admin: adminId, purpose, consumedAt: null }).sort({
    createdAt: -1,
  });

  if (!record) return { ok: false, error: "Request a new code - this one is no longer valid" };
  if (record.expiresAt < new Date()) return { ok: false, error: "That code expired. Request a new one." };

  if (record.attempts >= MAX_ATTEMPTS) {
    record.consumedAt = new Date();
    await record.save();
    return { ok: false, error: "Too many incorrect attempts. Request a new code.", locked: true };
  }

  const given = hashCode(String(code).trim());
  const expected = record.codeHash;
  const match =
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given, "hex"), Buffer.from(expected, "hex"));

  if (!match) {
    record.attempts += 1;
    await record.save();
    const left = MAX_ATTEMPTS - record.attempts;
    return {
      ok: false,
      error: left > 0 ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.` : "Too many incorrect attempts. Request a new code.",
      locked: left <= 0,
    };
  }

  record.consumedAt = new Date();
  await record.save();
  return { ok: true };
}

/** Called after a sensitive change so it always leaves a trace. */
export async function notifySensitiveChange(title: string, body: string) {
  await notify({ type: "auth", level: "warning", title, body });
}

function otpTemplate(code: string, purpose: OtpPurpose, ip: string): string {
  return `
<div style="background:#08090c;padding:32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#e7e7ea">
  <div style="max-width:520px;margin:0 auto;background:#0e1015;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden">
    <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(225,29,42,.18),transparent)">
      <span style="font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:#e11d2a;font-weight:700">Verification code</span>
    </div>
    <div style="padding:28px;font-size:15px;line-height:1.65">
      <p style="margin:0 0 20px">Use this code to ${escapeHtml(LABELS[purpose])}:</p>
      <div style="text-align:center;margin:0 0 20px">
        <span style="display:inline-block;font-size:34px;letter-spacing:12px;font-weight:700;color:#fff;background:#14161d;border:1px solid rgba(225,29,42,.35);border-radius:12px;padding:16px 24px 16px 36px">${code}</span>
      </div>
      <p style="margin:0 0 14px;color:#8a8f9c">It expires in ${TTL_MINUTES} minutes and can only be used once.</p>
      <p style="margin:0;color:#8a8f9c;font-size:13px">
        Requested from ${escapeHtml(ip)}. If this wasn't you, ignore this email and change your password immediately.
      </p>
    </div>
  </div>
</div>`;
}

import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

let transporter: Transporter | null = null;
let warned = false;

function getTransporter(): Transporter | null {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    if (!warned) {
      warned = true;
      console.warn("[mail] SMTP is not fully configured (host, user and pass are all required) - emails are logged to the console instead of sent.");
    }
    return null;
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

export type MailInput = {
  to?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendMail(input: MailInput): Promise<{ delivered: boolean; reason?: string }> {
  const tx = getTransporter();
  const to = input.to ?? env.smtp.to;
  if (!tx) {
    console.info(`[mail:dev] to=${to} subject=${input.subject}\n${input.text ?? input.html}`);
    return { delivered: false, reason: "smtp-not-configured" };
  }
  try {
    await tx.sendMail({
      from: env.smtp.from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { delivered: true };
  } catch (error) {
    console.error("[mail] delivery failed", error);
    return { delivered: false, reason: (error as Error).message };
  }
}

const shell = (title: string, inner: string) => `
<div style="background:#08090c;padding:32px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#e7e7ea">
  <div style="max-width:600px;margin:0 auto;background:#0e1015;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden">
    <div style="padding:20px 28px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(225,29,42,.18),transparent)">
      <span style="font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:#e11d2a;font-weight:700">${title}</span>
    </div>
    <div style="padding:28px;font-size:15px;line-height:1.65">${inner}</div>
    <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,.08);font-size:12px;color:#7b7f8a">
      Sent from venuakkamgari.dev
    </div>
  </div>
</div>`;

export function contactNotificationTemplate(m: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  company?: string;
  budget?: string;
}) {
  const row = (k: string, v?: string) =>
    v ? `<tr><td style="padding:6px 12px 6px 0;color:#7b7f8a">${k}</td><td style="padding:6px 0">${v}</td></tr>` : "";
  return shell(
    "New enquiry",
    `<table style="width:100%;border-collapse:collapse;margin-bottom:18px">
      ${row("Name", m.name)}${row("Email", m.email)}${row("Company", m.company)}
      ${row("Budget", m.budget)}${row("Subject", m.subject)}
    </table>
    <div style="background:#14161d;border-left:3px solid #e11d2a;padding:16px;border-radius:8px;white-space:pre-wrap">${escapeHtml(
      m.message
    )}</div>`
  );
}

export function autoReplyTemplate(name: string) {
  return shell(
    "Message received",
    `<p style="margin:0 0 14px">Hi ${escapeHtml(name)},</p>
     <p style="margin:0 0 14px">Thanks for reaching out - your message landed safely and I read every one personally.
     I usually reply within 24 hours.</p>
     <p style="margin:0">Best,<br/><strong style="color:#fff">Venu Akkamgari</strong><br/>
     <span style="color:#7b7f8a">Full Stack Developer</span></p>`
  );
}

export function replyTemplate(body: string) {
  return shell("Reply from Venu", `<div style="white-space:pre-wrap">${escapeHtml(body)}</div>`);
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

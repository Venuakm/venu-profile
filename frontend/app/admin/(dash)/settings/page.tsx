"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  KeyRound,
  Loader2,
  LogOut,
  MailCheck,
  Monitor,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button, Card, Input } from "@/components/admin/ui";
import { OtpInput } from "@/components/ui/otp-input";

type Session = { id: string; ip: string; userAgent: string; createdAt: string; expiresAt: string };
type Security = {
  username: string;
  email: string;
  otp: { deliversTo: string; emailConfigured: boolean; codeLength: number; expiresInMinutes: number };
};
type Purpose = "change-password" | "change-username" | "change-email";

export default function SettingsPage() {
  const { admin, logout, refresh } = useAdminAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [security, setSecurity] = useState<Security | null>(null);
  const [name, setName] = useState(admin?.name ?? "");
  const [saving, setSaving] = useState(false);

  const loadSecurity = useCallback(async () => {
    const data = await api<Security>("/api/auth/security").catch(() => null);
    if (data) setSecurity(data);
  }, []);

  useEffect(() => {
    api<{ sessions: Session[] }>("/api/auth/sessions")
      .then((data) => setSessions(data.sessions))
      .catch(() => undefined);
    void loadSecurity();
  }, [loadSecurity]);

  useEffect(() => {
    if (admin?.name) setName(admin.name);
  }, [admin?.name]);

  async function saveProfile() {
    setSaving(true);
    try {
      await api("/api/auth/profile", { method: "PATCH", json: { name } });
      await refresh();
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Could not save", { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Settings</h1>
        <p className="mt-1 text-xs text-mute">Your account, its sessions, and the checks that protect them.</p>
      </div>

      {security && !security.otp.emailConfigured ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-white/85">
            SMTP is not configured, so verification codes are printed in the backend terminal instead of being
            emailed. Add the <span className="font-mono">SMTP_*</span> values to <span className="font-mono">backend/.env</span>{" "}
            to receive them by email.
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profile" description="Safe to change - no verification needed.">
          <div className="space-y-4">
            <Input label="Display name" value={name} onChange={(event) => setName(event.target.value)} />
            <div className="rounded-xl border border-white/[0.07] bg-ink/40 p-3.5 text-xs text-mute">
              Last sign-in:{" "}
              <span className="text-white/80">
                {admin?.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : "unknown"}
              </span>
            </div>
            <Button onClick={saveProfile} loading={saving} className="text-xs">
              Save profile
            </Button>
          </div>
        </Card>

        <SecureAction
          title="Change username"
          description="Requires your password and an emailed code."
          purpose="change-username"
          icon={User}
          deliversTo={security?.otp.deliversTo ?? ""}
          fields={[
            {
              key: "username",
              label: "New username",
              placeholder: security?.username ?? "venuakm",
              type: "text",
            },
          ]}
          endpoint="/api/auth/secure/change-username"
          onDone={async () => {
            toast.success("Username changed");
            await loadSecurity();
          }}
        />

        <SecureAction
          title="Change password"
          description="At least 10 characters, with upper, lower and a number. Signs out every device."
          purpose="change-password"
          icon={KeyRound}
          deliversTo={security?.otp.deliversTo ?? ""}
          fields={[{ key: "newPassword", label: "New password", type: "password", placeholder: "" }]}
          endpoint="/api/auth/secure/change-password"
          onDone={() => {
            toast.success("Password changed", { description: "Signing you out - please sign in again." });
            setTimeout(() => void logout(), 1500);
          }}
        />

        <SecureAction
          title="Change account email"
          description="The code goes to your current address. Future codes go to the new one."
          purpose="change-email"
          icon={AtSign}
          deliversTo={security?.otp.deliversTo ?? ""}
          fields={[
            { key: "email", label: "New email", type: "email", placeholder: security?.email ?? "" },
          ]}
          endpoint="/api/auth/secure/change-email"
          onDone={async () => {
            toast.success("Account email changed");
            await refresh();
            await loadSecurity();
          }}
        />
      </div>

      <Card
        title="Active sessions"
        description="Every device with a valid refresh token."
        action={
          <Button
            variant="danger"
            className="text-xs"
            onClick={async () => {
              if (!confirm("Sign out of every device?")) return;
              await api("/api/auth/logout-all", { method: "POST" }).catch(() => undefined);
              void logout();
            }}
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out everywhere
          </Button>
        }
      >
        {sessions.length ? (
          <div className="space-y-2.5">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-ink/40 p-3.5"
              >
                <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-mute" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-white/85">{session.userAgent || "Unknown device"}</p>
                  <p className="mt-1 font-mono text-[10px] text-mute-soft">
                    {session.ip} - started {new Date(session.createdAt).toLocaleString()} - expires{" "}
                    {new Date(session.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-mute" />
          </div>
        )}
      </Card>

      <Card title="How this account is protected">
        <ul className="space-y-2.5 text-xs text-mute">
          {[
            "Username, password and email changes each need your password plus a one-time code emailed to you.",
            "Codes are six digits, single-use, valid for 10 minutes, and stored only as hashes.",
            "Five wrong guesses burns the code; requesting a new one invalidates the old one.",
            "Sign-in works by password or by emailed code - both are rate limited, and the account locks after repeated failures.",
            "Access tokens are short-lived and held in httpOnly cookies; refresh tokens rotate on every use.",
            "Reusing a revoked refresh token signs out every session and raises a critical alert.",
          ].map((item) => (
            <li key={item} className="flex gap-2.5">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/**
 * Two-step form for anything sensitive: fill in the change, request a code,
 * then confirm. The code is only requested once the inputs are valid, so a
 * mistyped field never burns one.
 */
function SecureAction({
  title,
  description,
  purpose,
  icon: Icon,
  fields,
  endpoint,
  deliversTo,
  onDone,
}: {
  title: string;
  description: string;
  purpose: Purpose;
  icon: typeof KeyRound;
  fields: { key: string; label: string; type: string; placeholder: string }[];
  endpoint: string;
  deliversTo: string;
  onDone: () => void | Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [stage, setStage] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const ready = fields.every((field) => values[field.key]?.trim()) && currentPassword.trim();

  async function sendCode() {
    setBusy(true);
    try {
      await api("/api/auth/otp/challenge", { json: { purpose } });
      setStage("verify");
      setCode("");
      setCooldown(45);
      toast.success("Code sent", { description: `Check ${deliversTo || "your email"}.` });
    } catch (error) {
      toast.error("Could not send the code", { description: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function confirm(submitted?: string) {
    const value = submitted ?? code;
    if (value.length < 6) return;
    setBusy(true);
    try {
      await api(endpoint, { json: { ...values, currentPassword, code: value } });
      setValues({});
      setCurrentPassword("");
      setCode("");
      setStage("form");
      await onDone();
    } catch (error) {
      toast.error("Verification failed", { description: (error as Error).message });
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={title} description={description}>
      <AnimatePresence mode="wait">
        {stage === "form" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {fields.map((field) => (
              <Input
                key={field.key}
                label={field.label}
                type={field.type}
                autoComplete={field.type === "password" ? "new-password" : "off"}
                placeholder={field.placeholder}
                value={values[field.key] ?? ""}
                onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              />
            ))}
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <Button onClick={sendCode} loading={busy} disabled={!ready} className="text-xs">
              <Icon className="h-3.5 w-3.5" />
              Send verification code
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3">
              <MailCheck className="h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs leading-snug text-white/85">
                Code sent to <span className="font-medium">{deliversTo || "your email"}</span> - valid for 10 minutes.
              </p>
            </div>

            <OtpInput value={code} onChange={setCode} onComplete={confirm} disabled={busy} />

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => confirm()} loading={busy} disabled={code.length < 6} className="text-xs">
                Confirm change
              </Button>
              <Button
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  setStage("form");
                  setCode("");
                }}
              >
                Cancel
              </Button>
              <button
                type="button"
                disabled={cooldown > 0 || busy}
                onClick={sendCode}
                className="ml-auto text-[11px] text-mute transition-colors hover:text-white disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

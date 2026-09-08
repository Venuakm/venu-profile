"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/lib/admin-auth";
import { ThemeToggle } from "@/components/theme";
import { OtpInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/cn";
import type { AdminUser } from "@/lib/types";

type Mode = "password" | "code";

export default function AdminLoginPage() {
  const { admin, login, loading, refresh } = useAdminAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Code sign-in
  const [codeSent, setCodeSent] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!loading && admin) router.replace("/admin");
  }, [admin, loading, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(identifier, password);
      router.replace("/admin");
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function requestCode(event?: React.FormEvent) {
    event?.preventDefault();
    if (!identifier.trim()) {
      setError("Enter your username or email first");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const result = await api<{ maskedEmail?: string }>("/api/auth/otp/request", {
        json: { identifier },
      });
      setMaskedEmail(result.maskedEmail ?? "your email");
      setCodeSent(true);
      setCode("");
      setCooldown(45);
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(value?: string) {
    const submitted = value ?? code;
    if (submitted.length < 6) return;
    setError("");
    setSubmitting(true);
    try {
      await api<{ admin: AdminUser }>("/api/auth/otp/verify", {
        json: { identifier, code: submitted },
      });
      await refresh();
      router.replace("/admin");
    } catch (submitError) {
      setError((submitError as Error).message);
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 grid-lines opacity-60" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(225,29,42,.22), transparent 70%)" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 46, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-mute transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </Link>
          <ThemeToggle />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7 backdrop-blur-2xl sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[var(--accent)]/15 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <span className="relative grid h-12 w-12 place-items-center rounded-xl border border-[var(--accent)]/45 bg-[var(--accent)]/10 text-[var(--accent)]">
              <Fingerprint className="h-5 w-5" />
              <span
                className="absolute inset-0 rounded-xl border border-[var(--accent)]/40"
                style={{ animation: "pulse-ring 3s ease-out infinite" }}
              />
            </span>
            <div>
              <h1 className="font-display text-2xl tracking-wide text-white">Owner access</h1>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-mute-soft">
                Restricted - authorised only
              </p>
            </div>
          </div>

          {/* Method switch */}
          {!codeSent ? (
            <div className="relative mt-7 flex gap-1.5 rounded-xl border border-white/[0.08] p-1">
              {(
                [
                  { id: "password", label: "Password", icon: Lock },
                  { id: "code", label: "Email code", icon: MailCheck },
                ] as const
              ).map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setMode(option.id);
                      setError("");
                    }}
                    className={cn(
                      "relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs transition-colors duration-200",
                      mode === option.id ? "text-white" : "text-mute hover:text-white"
                    )}
                  >
                    {mode === option.id ? (
                      <motion.span
                        layoutId="login-mode"
                        className="absolute inset-0 rounded-lg border border-[var(--accent)]/35 bg-[var(--accent)]/12"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                    <Icon className="relative z-10 h-3.5 w-3.5" />
                    <span className="relative z-10">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            {/* ---------------------------------------------- password sign-in */}
            {mode === "password" && !codeSent ? (
              <motion.form
                key="password"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.22 }}
                onSubmit={signInWithPassword}
                className="relative mt-6 space-y-4"
              >
                <Field
                  label="Email or username"
                  icon={User}
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  placeholder="venuakm"
                  onChange={setIdentifier}
                />

                <label className="block">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-mute-soft">
                    Password
                  </span>
                  <span className="relative block">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute-soft" />
                    <input
                      type={show ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••••"
                      className="w-full rounded-xl border border-white/[0.1] bg-ink/70 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition-colors focus:border-[var(--accent)]/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((value) => !value)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-mute-soft transition-colors hover:text-white"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </span>
                </label>

                {error ? <ErrorNote message={error} /> : null}

                <SubmitButton loading={submitting} icon={ShieldCheck}>
                  {submitting ? "Verifying..." : "Sign in"}
                </SubmitButton>
              </motion.form>
            ) : null}

            {/* ------------------------------------------ request a login code */}
            {mode === "code" && !codeSent ? (
              <motion.form
                key="request"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                onSubmit={requestCode}
                className="relative mt-6 space-y-4"
              >
                <p className="text-xs leading-relaxed text-mute">
                  We&apos;ll email a 6-digit code to the address on your account. No password needed.
                </p>

                <Field
                  label="Email or username"
                  icon={User}
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  placeholder="venuakm"
                  onChange={setIdentifier}
                />

                {error ? <ErrorNote message={error} /> : null}

                <SubmitButton loading={submitting} icon={Mail}>
                  {submitting ? "Sending..." : "Send me a code"}
                </SubmitButton>
              </motion.form>
            ) : null}

            {/* ----------------------------------------------- enter the code */}
            {codeSent ? (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
                className="relative mt-7 space-y-4"
              >
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] px-4 py-3">
                  <MailCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                  <p className="text-xs leading-snug text-white/85">
                    Code sent to <span className="font-medium">{maskedEmail}</span>. It expires in 10 minutes.
                  </p>
                </div>

                <OtpInput value={code} onChange={setCode} onComplete={verifyCode} disabled={submitting} />

                {error ? <ErrorNote message={error} /> : null}

                <SubmitButton loading={submitting} icon={ShieldCheck} onClick={() => verifyCode()} type="button">
                  {submitting ? "Verifying..." : "Verify and sign in"}
                </SubmitButton>

                <div className="flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false);
                      setCode("");
                      setError("");
                    }}
                    className="text-mute transition-colors hover:text-white"
                  >
                    Use a different account
                  </button>
                  <button
                    type="button"
                    disabled={cooldown > 0 || submitting}
                    onClick={() => void requestCode()}
                    className="text-mute transition-colors hover:text-white disabled:opacity-50"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <p className="relative mt-6 border-t border-white/[0.07] pt-5 text-center text-[11px] leading-relaxed text-mute-soft">
            Protected by rate limiting, account lockout and rotating sessions.
            <br />
            Every sign-in attempt is logged.
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function Field({
  label,
  icon: Icon,
  value,
  onChange,
  ...props
}: {
  label: string;
  icon: typeof User;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-mute-soft">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute-soft" />
        <input
          {...props}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/[0.1] bg-ink/70 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-colors focus:border-[var(--accent)]/60"
        />
      </span>
    </label>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
    >
      {message}
    </motion.p>
  );
}

function SubmitButton({
  children,
  loading,
  icon: Icon,
  ...props
}: {
  children: React.ReactNode;
  loading?: boolean;
  icon: typeof ShieldCheck;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      {...props}
      disabled={loading}
      className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white accent-glow transition-opacity disabled:opacity-70"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {children}
      <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />
    </button>
  );
}

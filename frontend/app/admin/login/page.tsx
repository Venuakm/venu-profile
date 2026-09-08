"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Fingerprint, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { ThemeToggle } from "@/components/theme";

export default function AdminLoginPage() {
  const { admin, login, loading } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && admin) router.replace("/admin");
  }, [admin, loading, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/admin");
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-16">
      {/* Ambient field */}
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

          <form onSubmit={onSubmit} className="relative mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-mute-soft">
                Email or username
              </span>
              <span className="relative block">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mute-soft" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="venuakm"
                  className="w-full rounded-xl border border-white/[0.1] bg-ink/70 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-colors focus:border-[var(--accent)]/60"
                />
              </span>
            </label>

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

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </motion.p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-[var(--accent)] py-3.5 text-sm font-semibold text-white accent-glow transition-opacity disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {submitting ? "Verifying..." : "Sign in"}
              <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />
            </button>
          </form>

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

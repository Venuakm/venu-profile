"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, LogOut, Monitor, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/lib/admin-auth";
import { Button, Card, Input } from "@/components/admin/ui";

type Session = { id: string; ip: string; userAgent: string; createdAt: string; expiresAt: string };

export default function SettingsPage() {
  const { admin, logout, refresh } = useAdminAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [name, setName] = useState(admin?.name ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    api<{ sessions: Session[] }>("/api/auth/sessions")
      .then((data) => setSessions(data.sessions))
      .catch(() => undefined);
  }, []);

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

  async function changePassword() {
    if (next !== confirmation) {
      toast.error("The new passwords do not match");
      return;
    }
    setChanging(true);
    try {
      await api("/api/auth/change-password", { json: { currentPassword: current, newPassword: next } });
      toast.success("Password changed", { description: "Signing you out - please sign in again." });
      setTimeout(() => void logout(), 1400);
    } catch (error) {
      toast.error("Could not change password", { description: (error as Error).message });
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Settings</h1>
        <p className="mt-1 text-xs text-mute">Your account and its active sessions.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profile">
          <div className="space-y-4">
            <Input label="Display name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input label="Email" value={admin?.email ?? ""} disabled />
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

        <Card title="Change password" description="At least 10 characters, with upper, lower and a number.">
          <div className="space-y-4">
            <Input
              label="Current password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <Button onClick={changePassword} loading={changing} className="text-xs">
              <KeyRound className="h-3.5 w-3.5" />
              Change password
            </Button>
            <p className="text-[11px] text-mute-soft">
              Changing your password signs out every device, including this one.
            </p>
          </div>
        </Card>
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

      <Card title="Security">
        <ul className="space-y-2.5 text-xs text-mute">
          {[
            "Passwords hashed with bcrypt (cost 12) - never stored or logged in plain text.",
            "Short-lived access tokens in httpOnly cookies, with rotating refresh tokens stored only as hashes.",
            "Reusing a revoked refresh token signs out every session and raises a critical alert.",
            "Sign-in is rate limited, and the account locks after repeated failures.",
            "Mutating requests need a header a cross-site form cannot set, on top of SameSite cookies.",
            "Uploads are restricted by MIME type and size before they touch disk.",
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

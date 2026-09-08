"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Bell,
  Check,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  FolderKanban,
  Settings,
  FileText,
  X,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { API_URL, api } from "@/lib/api";
import { useAdminAuth } from "@/lib/admin-auth";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/theme";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/content", label: "Site content", icon: FileText },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/messages", label: "Messages", icon: Mail },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { admin, loading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (!loading && !admin) router.replace("/admin/login");
  }, [admin, loading, router]);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await api<{ notifications: Notification[]; unread: number }>(
        "/api/admin/notifications?limit=25"
      );
      setNotifications(data.notifications);
      setUnread(data.unread);
    } catch {
      /* the stream will catch up */
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    void loadNotifications();
  }, [admin, loadNotifications]);

  // Live push: new notifications arrive over server-sent events.
  useEffect(() => {
    if (!admin) return;
    const source = new EventSource(`${API_URL}/api/admin/stream`, { withCredentials: true });

    source.addEventListener("notification", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as Notification;
      setNotifications((current) => [payload, ...current].slice(0, 40));
      setUnread((count) => count + 1);
      toast(payload.title, { description: payload.body || undefined });
    });

    source.onerror = () => {
      /* EventSource reconnects on its own */
    };

    return () => source.close();
  }, [admin]);

  async function markAllRead() {
    await api("/api/admin/notifications/read-all", { method: "POST" });
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnread(0);
  }

  if (loading || !admin) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div aria-hidden className="pointer-events-none fixed inset-0 grid-lines opacity-40" />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] border-r border-white/[0.07] bg-ink-soft/90 backdrop-blur-2xl transition-transform duration-400 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/[0.07] px-5">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--accent)]/45 bg-[var(--accent)]/10 font-display text-sm text-[var(--accent)]">
              V
            </span>
            <span className="font-display text-sm tracking-[0.2em] text-white">CONTROL</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-mute lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1 p-4">
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-200",
                  active ? "text-white" : "text-mute hover:bg-white/[0.04] hover:text-white"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="admin-nav"
                    className="absolute inset-0 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/12"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{item.label}</span>
                {item.href === "/admin/notifications" && unread > 0 ? (
                  <span className="relative z-10 ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[var(--accent)] px-1.5 text-[10px] font-bold text-white">
                    {unread}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.07] p-4">
          <Link
            href="/"
            target="_blank"
            className="mb-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-mute transition-colors hover:bg-white/[0.04] hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View site
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-mute transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      ) : null}

      {/* Main */}
      <div className="relative lg:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.07] bg-ink/80 px-5 backdrop-blur-2xl sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-lg border border-white/10 p-2 text-white lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
              {NAV.find((item) => (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)))
                ?.label ?? "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="relative">
              <button
                type="button"
                onClick={() => setPanelOpen((value) => !value)}
                className="relative grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-white/80 transition-colors hover:border-white/25"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </button>

              <AnimatePresence>
                {panelOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-white/[0.1] bg-ink-soft/95 backdrop-blur-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
                        Notifications
                      </span>
                      <button
                        type="button"
                        onClick={() => void markAllRead()}
                        className="flex items-center gap-1.5 text-[11px] text-mute transition-colors hover:text-white"
                      >
                        <Check className="h-3 w-3" />
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-[380px] overflow-y-auto">
                      {notifications.length ? (
                        notifications.map((item) => (
                          <div
                            key={item._id}
                            className={cn(
                              "border-b border-white/[0.05] px-4 py-3 transition-colors hover:bg-white/[0.03]",
                              !item.read && "bg-[var(--accent)]/[0.05]"
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              <span
                                className={cn(
                                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                  item.level === "critical"
                                    ? "bg-red-400"
                                    : item.level === "warning"
                                      ? "bg-amber-400"
                                      : item.level === "success"
                                        ? "bg-emerald-400"
                                        : "bg-white/40"
                                )}
                              />
                              <div className="min-w-0">
                                <p className="text-[13px] leading-snug text-white/90">{item.title}</p>
                                {item.body ? (
                                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-mute">{item.body}</p>
                                ) : null}
                                <p className="mt-1 font-mono text-[10px] text-mute-soft">
                                  {new Date(item.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="px-4 py-10 text-center text-sm text-mute">Nothing yet.</p>
                      )}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-white/10 py-1.5 pl-1.5 pr-3">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-[var(--accent)]/15 font-display text-[11px] text-[var(--accent)]">
                {admin.name?.[0] ?? "V"}
              </span>
              <span className="hidden text-xs text-white/80 sm:block">{admin.name}</span>
            </div>
          </div>
        </header>

        <main className="relative px-5 py-7 sm:px-7 sm:py-9">{children}</main>
      </div>
    </div>
  );
}

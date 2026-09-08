"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Bell, Check, Loader2, Trash2, Zap } from "lucide-react";
import { api } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button, EmptyState } from "@/components/admin/ui";

const TYPES = ["all", "message", "auth", "content", "project", "media", "system"];

const LEVEL_STYLES: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/[0.06]",
  warning: "border-amber-500/30 bg-amber-500/[0.06]",
  success: "border-emerald-500/25 bg-emerald-500/[0.05]",
  info: "border-white/[0.08] bg-white/[0.022]",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ notifications: Notification[] }>(
        `/api/admin/notifications?limit=100&type=${type}`
      );
      setNotifications(data.notifications);
    } catch (error) {
      toast.error("Could not load notifications", { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white">Notifications</h1>
          <p className="mt-1 text-xs text-mute">
            Messages, sign-ins, content edits and uploads - pushed here the moment they happen.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() =>
              api("/api/admin/notifications/test", { json: {} })
                .then(() => toast.success("Test sent"))
                .catch(() => toast.error("Could not send"))
            }
          >
            <Zap className="h-3.5 w-3.5" />
            Send test
          </Button>
          <Button
            variant="ghost"
            className="text-xs"
            onClick={async () => {
              await api("/api/admin/notifications/read-all", { method: "POST" });
              await load();
            }}
          >
            <Check className="h-3.5 w-3.5" />
            Mark all read
          </Button>
          <Button
            variant="danger"
            className="text-xs"
            onClick={async () => {
              if (!confirm("Delete every notification you have already read?")) return;
              await api("/api/admin/notifications", { method: "DELETE" });
              await load();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear read
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TYPES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={cn(
              "relative shrink-0 rounded-xl px-4 py-2 text-xs capitalize transition-colors",
              type === item ? "text-white" : "text-mute hover:text-white"
            )}
          >
            {type === item ? (
              <motion.span
                layoutId="notif-filter"
                className="absolute inset-0 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/12"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{item}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : notifications.length ? (
        <div className="space-y-2.5">
          {notifications.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className={cn(
                "flex items-start gap-4 rounded-2xl border p-4",
                LEVEL_STYLES[item.level] ?? LEVEL_STYLES.info,
                !item.read && "ring-1 ring-inset ring-[var(--accent)]/20"
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10">
                <Bell className="h-3.5 w-3.5 text-white/70" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-white/90">{item.title}</span>
                  <span className="rounded-full border border-white/12 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mute-soft">
                    {item.type}
                  </span>
                  {!item.read ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> : null}
                </div>
                {item.body ? <p className="mt-1 text-xs leading-relaxed text-mute">{item.body}</p> : null}
                <p className="mt-1.5 font-mono text-[10px] text-mute-soft">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                {!item.read ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await api(`/api/admin/notifications/${item._id}/read`, { method: "POST" });
                      await load();
                    }}
                    className="rounded-lg border border-white/10 p-2 text-mute transition-colors hover:text-white"
                    aria-label="Mark read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={async () => {
                    await api(`/api/admin/notifications/${item._id}`, { method: "DELETE" });
                    await load();
                  }}
                  className="rounded-lg border border-white/10 p-2 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState title="Nothing here yet" description="Notifications appear as things happen on the site." />
      )}
    </div>
  );
}

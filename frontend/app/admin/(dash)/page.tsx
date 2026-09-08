"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Mail,
  MailOpen,
  Reply,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAdminAuth } from "@/lib/admin-auth";
import type { Message, Project } from "@/lib/types";
import { Button, Card } from "@/components/admin/ui";

type Stats = {
  messages: { total: number; unread: number; replied: number; last30: number };
  daily: { _id: string; count: number }[];
};

export default function OverviewPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void Promise.all([
      api<Stats>("/api/admin/stats").then(setStats),
      api<{ messages: Message[] }>("/api/admin/messages?limit=5").then((data) => setMessages(data.messages)),
      api<{ projects: Project[] }>("/api/admin/projects").then((data) => setProjects(data.projects)),
    ]).catch(() => toast.error("Could not load the dashboard"));
  }, []);

  const tiles = [
    { label: "Total messages", value: stats?.messages.total ?? 0, icon: Mail, href: "/admin/messages" },
    { label: "Unread", value: stats?.messages.unread ?? 0, icon: MailOpen, href: "/admin/messages?status=new", accent: true },
    { label: "Replied", value: stats?.messages.replied ?? 0, icon: Reply, href: "/admin/messages?status=replied" },
    { label: "Projects", value: projects.length, icon: FolderKanban, href: "/admin/projects" },
  ];

  const peak = Math.max(1, ...(stats?.daily ?? []).map((day) => day.count));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[var(--accent)]/[0.12] via-white/[0.02] to-transparent p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[var(--accent)]/20 blur-3xl" />
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)]">Welcome back</p>
        <h1 className="mt-3 font-display text-3xl tracking-wide text-white sm:text-4xl">{admin?.name}</h1>
        <p className="mt-2 max-w-lg text-sm text-mute">
          Everything on the site - text, images, projects and links - is editable from here, and changes go live
          within seconds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/content">
            <Button className="text-xs">
              <FileText className="h-3.5 w-3.5" />
              Edit site content
            </Button>
          </Link>
          <Link href="/admin/projects">
            <Button variant="ghost" className="text-xs">
              <FolderKanban className="h-3.5 w-3.5" />
              Manage projects
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="text-xs"
            onClick={() =>
              api("/api/admin/notifications/test", { json: {} })
                .then(() => toast.success("Test notification sent"))
                .catch(() => toast.error("Could not send"))
            }
          >
            <Zap className="h-3.5 w-3.5" />
            Test notifications
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile, index) => {
          const Icon = tile.icon;
          return (
            <motion.div
              key={tile.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
            >
              <Link
                href={tile.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5 transition-all duration-300 hover:border-[var(--accent)]/35 hover:bg-[var(--accent)]/[0.05]"
              >
                <div className="flex items-start justify-between">
                  <Icon className={tile.accent ? "h-4 w-4 text-[var(--accent)]" : "h-4 w-4 text-mute"} />
                  <ArrowUpRight className="h-3.5 w-3.5 text-mute-soft transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <div className="mt-6">
                  <div className="font-display text-3xl text-white">{tile.value}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-mute-soft">
                    {tile.label}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card title="Enquiries" description="Last 30 days">
          {stats?.daily?.length ? (
            <div className="flex h-40 items-end gap-1.5">
              {stats.daily.map((day) => (
                <div key={day._id} className="group relative flex-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.count / peak) * 100}%` }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-t bg-gradient-to-t from-[var(--accent)]/40 to-[var(--accent)]"
                    style={{ minHeight: 4 }}
                  />
                  <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-ink px-2 py-1 font-mono text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {day._id}: {day.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-14 text-center text-sm text-mute">No enquiries in the last 30 days.</p>
          )}
        </Card>

        <Card
          title="Recent messages"
          action={
            <Link href="/admin/messages" className="text-xs text-mute transition-colors hover:text-white">
              View all
            </Link>
          }
        >
          <div className="space-y-2.5">
            {messages.length ? (
              messages.map((message) => (
                <Link
                  key={message._id}
                  href="/admin/messages"
                  className="block rounded-xl border border-white/[0.07] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm text-white/90">{message.name}</span>
                    {message.status === "new" ? (
                      <span className="shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                        new
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-mute">{message.message}</p>
                </Link>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-mute">No messages yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/admin/content", icon: FileText, title: "Site content", body: "Headlines, bio, experience, skills, contact details and links." },
          { href: "/admin/media", icon: ImageIcon, title: "Media", body: "Upload and manage every image used across the site." },
          { href: "/admin/notifications", icon: Bell, title: "Notifications", body: "Everything that happened, newest first." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5 transition-all duration-300 hover:border-white/20"
            >
              <Icon className="h-5 w-5 text-[var(--accent)]" />
              <h3 className="mt-4 font-display text-lg tracking-wide text-white">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-mute">{item.body}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

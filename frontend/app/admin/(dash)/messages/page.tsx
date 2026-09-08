"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Archive, Loader2, Mail, Reply, Search, Star, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button, EmptyState, Input, Modal, Textarea } from "@/components/admin/ui";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "new", label: "Unread" },
  { id: "read", label: "Read" },
  { id: "replied", label: "Replied" },
  { id: "archived", label: "Archived" },
];

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Message | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, limit: "100" });
      if (query) params.set("q", query);
      const data = await api<{ messages: Message[] }>(`/api/admin/messages?${params}`);
      setMessages(data.messages);
    } catch (error) {
      toast.error("Could not load messages", { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function open(message: Message) {
    setActive(message);
    setReply("");
    if (message.status === "new") {
      await api(`/api/admin/messages/${message._id}`, { method: "PATCH", json: { status: "read" } }).catch(
        () => undefined
      );
      setMessages((current) =>
        current.map((item) => (item._id === message._id ? { ...item, status: "read" } : item))
      );
    }
  }

  async function sendReply() {
    if (!active || !reply.trim()) return;
    setSending(true);
    try {
      const result = await api<{ delivered: boolean; reason?: string }>(
        `/api/admin/messages/${active._id}/reply`,
        { json: { body: reply } }
      );
      if (result.delivered) {
        toast.success("Reply sent");
      } else {
        toast.warning("Reply saved but not emailed", {
          description:
            result.reason === "smtp-not-configured"
              ? "Add SMTP settings to the backend .env to send real email."
              : result.reason,
        });
      }
      setActive(null);
      await load();
    } catch (error) {
      toast.error("Could not send", { description: (error as Error).message });
    } finally {
      setSending(false);
    }
  }

  async function update(message: Message, changes: Partial<Message>) {
    await api(`/api/admin/messages/${message._id}`, { method: "PATCH", json: changes }).catch(() =>
      toast.error("Update failed")
    );
    await load();
  }

  async function remove(message: Message) {
    if (!confirm(`Delete the message from ${message.name}?`)) return;
    await api(`/api/admin/messages/${message._id}`, { method: "DELETE" }).catch(() => toast.error("Delete failed"));
    setActive(null);
    await load();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Messages</h1>
        <p className="mt-1 text-xs text-mute">Everything sent through the contact form.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setStatus(filter.id)}
              className={cn(
                "relative shrink-0 rounded-xl px-4 py-2 text-xs transition-colors",
                status === filter.id ? "text-white" : "text-mute hover:text-white"
              )}
            >
              {status === filter.id ? (
                <motion.span
                  layoutId="message-filter"
                  className="absolute inset-0 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/12"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <span className="relative z-10">{filter.label}</span>
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute-soft" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or text"
            className="w-full rounded-xl border border-white/[0.09] bg-ink/60 py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-[var(--accent)]/60"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : messages.length ? (
        <div className="space-y-2.5">
          {messages.map((message, index) => (
            <motion.button
              key={message._id}
              type="button"
              onClick={() => void open(message)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.02 }}
              className={cn(
                "flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors",
                message.status === "new"
                  ? "border-[var(--accent)]/25 bg-[var(--accent)]/[0.05]"
                  : "border-white/[0.08] bg-white/[0.022] hover:border-white/[0.18]"
              )}
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 font-display text-sm text-white">
                {message.name?.[0]?.toUpperCase() ?? "?"}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-white">{message.name}</span>
                  <span className="text-xs text-mute-soft">{message.email}</span>
                  {message.status === "new" ? (
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                      new
                    </span>
                  ) : null}
                  {message.status === "replied" ? (
                    <span className="rounded-full border border-emerald-400/30 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                      replied
                    </span>
                  ) : null}
                </div>
                {message.subject ? <p className="mt-1 text-xs text-white/70">{message.subject}</p> : null}
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mute">{message.message}</p>
              </div>

              <span className="shrink-0 font-mono text-[10px] text-mute-soft">
                {new Date(message.createdAt).toLocaleDateString()}
              </span>
            </motion.button>
          ))}
        </div>
      ) : (
        <EmptyState title="No messages here" description="New enquiries from the contact form land in this list." />
      )}

      <Modal open={Boolean(active)} onClose={() => setActive(null)} title={active?.name ?? "Message"} wide>
        {active ? (
          <div className="space-y-5">
            <div className="grid gap-2 rounded-xl border border-white/[0.07] bg-ink/40 p-4 text-xs sm:grid-cols-2">
              <Detail label="Email" value={active.email} />
              <Detail label="Received" value={new Date(active.createdAt).toLocaleString()} />
              {active.company ? <Detail label="Company" value={active.company} /> : null}
              {active.subject ? <Detail label="Subject" value={active.subject} /> : null}
              {active.budget ? <Detail label="Budget" value={active.budget} /> : null}
              <Detail label="IP" value={active.ip} />
            </div>

            <div className="rounded-xl border-l-2 border-[var(--accent)] bg-white/[0.03] p-4 text-sm leading-relaxed whitespace-pre-wrap text-white/85">
              {active.message}
            </div>

            {active.replies?.length ? (
              <div className="space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">Your replies</p>
                {active.replies.map((item, index) => (
                  <div key={index} className="rounded-xl border border-white/[0.07] bg-ink/40 p-3.5 text-xs">
                    <p className="whitespace-pre-wrap text-white/80">{item.body}</p>
                    <p className="mt-2 font-mono text-[10px] text-mute-soft">
                      {new Date(item.sentAt).toLocaleString()} - {item.delivered ? "delivered" : "not emailed"}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <Textarea
              label="Reply"
              rows={5}
              value={reply}
              placeholder={`Hi ${active.name.split(" ")[0]},`}
              onChange={(event) => setReply(event.target.value)}
            />

            <div className="flex flex-wrap justify-between gap-2 border-t border-white/[0.07] pt-4">
              <div className="flex gap-2">
                <Button variant="ghost" className="text-xs" onClick={() => void update(active, { starred: !active.starred })}>
                  <Star className={active.starred ? "h-3.5 w-3.5 fill-[var(--accent)] text-[var(--accent)]" : "h-3.5 w-3.5"} />
                  Star
                </Button>
                <Button variant="ghost" className="text-xs" onClick={() => void update(active, { status: "archived" })}>
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </Button>
                <Button variant="danger" className="text-xs" onClick={() => void remove(active)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
              <div className="flex gap-2">
                <a href={`mailto:${active.email}`}>
                  <Button variant="ghost" className="text-xs">
                    <Mail className="h-3.5 w-3.5" />
                    Open in mail app
                  </Button>
                </a>
                <Button className="text-xs" onClick={sendReply} loading={sending} disabled={!reply.trim()}>
                  <Reply className="h-3.5 w-3.5" />
                  Send reply
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute-soft">{label}</span>
      <p className="mt-0.5 truncate text-white/85">{value}</p>
    </div>
  );
}

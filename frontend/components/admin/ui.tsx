"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Pencil, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api, API_URL } from "@/lib/api";
import type { MediaItem } from "@/lib/types";
import { cn } from "@/lib/cn";

export function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5 sm:p-6", className)}>
      {title || action ? (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="font-display text-lg tracking-wide text-white">{title}</h2> : null}
            {description ? <p className="mt-1 text-xs text-mute">{description}</p> : null}
          </div>
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
  loading?: boolean;
}) {
  const styles = {
    primary: "bg-[var(--accent)] text-white hover:brightness-110",
    ghost: "border border-white/12 text-white/85 hover:border-white/30 hover:bg-white/[0.04]",
    subtle: "bg-white/[0.06] text-white/85 hover:bg-white/[0.1]",
    danger: "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
  }[variant];

  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:opacity-60",
        styles,
        className
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Input({
  label,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">{label}</span>
      ) : null}
      <input
        {...props}
        className={cn(
          "w-full rounded-xl border border-white/[0.09] bg-ink/60 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-mute-soft/60 focus:border-[var(--accent)]/60",
          className
        )}
      />
      {hint ? <span className="mt-1 block text-[11px] text-mute-soft">{hint}</span> : null}
    </label>
  );
}

export function Textarea({
  label,
  hint,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">{label}</span>
      ) : null}
      <textarea
        {...props}
        className={cn(
          "w-full resize-y rounded-xl border border-white/[0.09] bg-ink/60 px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-mute-soft/60 focus:border-[var(--accent)]/60",
          className
        )}
      />
      {hint ? <span className="mt-1 block text-[11px] text-mute-soft">{hint}</span> : null}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-white/[0.09] bg-ink/40 px-4 py-3 text-sm text-white/85 transition-colors hover:border-white/20"
    >
      {label}
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-300",
          checked ? "bg-[var(--accent)]" : "bg-white/15"
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

/** Editable list of plain strings (bullets, highlights, tags...). */
export function StringList({
  label,
  values,
  onChange,
  placeholder = "Add an item",
  textarea,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const Field = textarea ? Textarea : Input;

  return (
    <div>
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">{label}</span>
      <div className="space-y-2">
        {values.map((value, index) => (
          <div key={index} className="flex items-start gap-2">
            <Field
              value={value}
              rows={textarea ? 3 : undefined}
              onChange={(event: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => {
                const next = [...values];
                next[index] = event.target.value;
                onChange(next);
              }}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              className="mt-1 rounded-lg border border-white/10 p-2.5 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-start gap-2">
        <Field
          value={draft}
          rows={textarea ? 3 : undefined}
          placeholder={placeholder}
          onChange={(event: React.ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => setDraft(event.target.value)}
          onKeyDown={(event: React.KeyboardEvent) => {
            if (event.key === "Enter" && !textarea) {
              event.preventDefault();
              if (draft.trim()) {
                onChange([...values, draft.trim()]);
                setDraft("");
              }
            }
          }}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...values, draft.trim()]);
            setDraft("");
          }}
          className="mt-1 rounded-lg border border-white/10 p-2.5 text-mute transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
          aria-label="Add"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/** Image field: shows the current image, uploads a new one, or takes a URL. */
export function ImageField({
  label,
  value,
  onChange,
  aspect = "aspect-video",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [picking, setPicking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const { media } = await api<{ media: MediaItem }>("/api/admin/media", { method: "POST", body });
      onChange(media.url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Upload failed", { description: (error as Error).message });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">{label}</span>
      <div className={cn("relative overflow-hidden rounded-xl border border-white/[0.09] bg-ink/50", aspect)}>
        {value ? (
          // Any host is allowed here, so a plain img keeps it simple.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-xs text-mute-soft">No image</div>
        )}
        {uploading ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/70">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" variant="subtle" onClick={() => inputRef.current?.click()} className="px-3 py-2 text-xs">
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
        <Button type="button" variant="ghost" onClick={() => setPicking(true)} className="px-3 py-2 text-xs">
          Library
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
      </div>

      <Input
        className="mt-2 text-xs"
        value={value}
        placeholder="/placeholders/portrait.svg or https://..."
        onChange={(event) => onChange(event.target.value)}
      />

      <MediaPicker open={picking} onClose={() => setPicking(false)} onPick={(url) => onChange(url)} />
    </div>
  );
}

export function MediaPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api<{ media: MediaItem[] }>("/api/admin/media?limit=60")
      .then((data) => setMedia(data.media))
      .catch(() => toast.error("Could not load the media library"))
      .finally(() => setLoading(false));
  }, [open]);

  const PLACEHOLDERS = [
    "/placeholders/portrait.svg",
    "/placeholders/about.svg",
    "/placeholders/project-1.svg",
    "/placeholders/project-2.svg",
    "/placeholders/project-3.svg",
    "/placeholders/project-4.svg",
    "/placeholders/project-5.svg",
    "/placeholders/logo-zestfindz.svg",
    "/placeholders/logo-kas.svg",
    "/placeholders/logo-boostopia.svg",
  ];

  return (
    <Modal open={open} onClose={onClose} title="Media library" wide>
      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
        </div>
      ) : (
        <div className="space-y-6">
          {media.length ? (
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">Uploads</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {media.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      onPick(item.url);
                      onClose();
                    }}
                    className="group overflow-hidden rounded-xl border border-white/[0.09] transition-colors hover:border-[var(--accent)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt || item.originalName} className="aspect-video w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">Placeholders</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PLACEHOLDERS.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => {
                    onPick(url);
                    onClose();
                  }}
                  className="group overflow-hidden rounded-xl border border-white/[0.09] transition-colors hover:border-[var(--accent)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={url} className="aspect-video w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "my-8 w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-ink-soft/95 backdrop-blur-2xl",
              wide ? "max-w-3xl" : "max-w-lg"
            )}
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <h3 className="font-display text-lg tracking-wide text-white">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-mute transition-colors hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div data-lenis-prevent className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Sticky bar that appears when there are unsaved changes. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onReset?: () => void;
}) {
  return (
    <AnimatePresence>
      {dirty ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-5 z-[60] mx-auto flex w-[min(92%,560px)] items-center justify-between gap-4 rounded-2xl border border-white/[0.12] bg-ink-soft/95 px-5 py-3.5 backdrop-blur-2xl"
        >
          <span className="text-sm text-white/85">You have unsaved changes</span>
          <div className="flex gap-2">
            {onReset ? (
              <Button variant="ghost" onClick={onReset} className="px-3 py-2 text-xs">
                Discard
              </Button>
            ) : null}
            <Button onClick={onSave} loading={saving} className="px-4 py-2 text-xs">
              {saving ? "Saving" : "Save changes"}
              {!saving ? <Check className="h-3.5 w-3.5" /> : null}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/12 p-12 text-center">
      <p className="font-display text-lg text-white/80">{title}</p>
      {description ? <p className="mx-auto mt-2 max-w-sm text-sm text-mute">{description}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export { Pencil, Plus, Trash2 };
export { API_URL };

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check, Copy, Loader2, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api";
import type { MediaItem } from "@/lib/types";
import { Button, EmptyState, Input } from "@/components/admin/ui";

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ media: MediaItem[] }>("/api/admin/media?limit=120");
      setMedia(data.media);
    } catch (error) {
      toast.error("Could not load media", { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          const body = new FormData();
          body.append("file", file);
          await api("/api/admin/media", { method: "POST", body });
        }
        toast.success(`Uploaded ${Array.from(files).length} file(s)`);
        await load();
      } catch (error) {
        toast.error("Upload failed", { description: (error as Error).message });
      } finally {
        setUploading(false);
      }
    },
    [load]
  );

  async function remove(item: MediaItem) {
    if (!confirm(`Delete ${item.originalName || item.filename}? Anything using it will show a broken image.`)) return;
    await api(`/api/admin/media/${item._id}`, { method: "DELETE" }).catch(() => toast.error("Delete failed"));
    await load();
  }

  function copy(url: string) {
    void navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("URL copied");
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Media</h1>
        <p className="mt-1 text-xs text-mute">
          Upload images once, then pick them anywhere - hero, about, projects or logos.
        </p>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (event.dataTransfer.files?.length) void upload(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
          dragging ? "border-[var(--accent)] bg-[var(--accent)]/[0.06]" : "border-white/12 hover:border-white/25"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        ) : (
          <>
            <Upload className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-3 text-sm text-white/85">Drop images here, or click to choose</p>
            <p className="mt-1 text-xs text-mute-soft">JPG, PNG, WebP, AVIF, GIF, SVG or PDF - up to 8MB each</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          hidden
          onChange={(event) => {
            if (event.target.files?.length) void upload(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : media.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.03 }}
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.022]"
            >
              <div className="relative aspect-video overflow-hidden bg-ink">
                {item.mime?.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.alt || item.originalName} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-mute">{item.mime}</div>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-ink/80 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="subtle" className="px-3 py-2 text-xs" onClick={() => copy(item.url)}>
                    {copied === item.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy URL
                  </Button>
                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => void remove(item)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="truncate text-xs text-white/85">{item.originalName || item.filename}</p>
                <p className="mt-0.5 font-mono text-[10px] text-mute-soft">
                  {(item.size / 1024).toFixed(0)} KB - {new Date(item.createdAt).toLocaleDateString()}
                </p>
                <Input
                  className="mt-2 py-1.5 text-[11px]"
                  defaultValue={item.alt}
                  placeholder="Alt text"
                  onBlur={(event) =>
                    void api(`/api/admin/media/${item._id}`, {
                      method: "PATCH",
                      json: { alt: event.target.value },
                    }).catch(() => toast.error("Could not save alt text"))
                  }
                />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nothing uploaded yet"
          description="The site currently uses the placeholder artwork that shipped with it."
        />
      )}
    </div>
  );
}

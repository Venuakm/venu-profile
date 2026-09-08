"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Eye, EyeOff, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { Button, Card, EmptyState, ImageField, Input, Modal, StringList, Textarea, Toggle } from "@/components/admin/ui";

const blank: Partial<Project> = {
  title: "",
  slug: "",
  tagline: "",
  summary: "",
  description: "",
  cover: "/placeholders/project-cover.svg",
  gallery: [],
  tags: [],
  stack: [],
  role: "",
  year: String(new Date().getFullYear()),
  metrics: [],
  links: { live: "", github: "", caseStudy: "" },
  featured: false,
  published: true,
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ projects: Project[] }>("/api/admin/projects");
      setProjects(data.projects);
    } catch (error) {
      toast.error("Could not load projects", { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!editing?.title) {
      toast.error("A title is required");
      return;
    }
    setSaving(true);
    try {
      if (editing._id) {
        const { _id, createdAt, updatedAt, ...payload } = editing as Project;
        await api(`/api/admin/projects/${_id}`, { method: "PATCH", json: payload });
        toast.success("Project updated");
      } else {
        await api("/api/admin/projects", { json: editing });
        toast.success("Project created");
      }
      setEditing(null);
      await load();
    } catch (error) {
      toast.error("Save failed", { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(project: Project) {
    if (!confirm(`Delete "${project.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/projects/${project._id}`, { method: "DELETE" });
      toast.success("Project deleted");
      await load();
    } catch (error) {
      toast.error("Delete failed", { description: (error as Error).message });
    }
  }

  async function toggleField(project: Project, field: "published" | "featured") {
    try {
      await api(`/api/admin/projects/${project._id}`, {
        method: "PATCH",
        json: { [field]: !project[field] },
      });
      await load();
    } catch (error) {
      toast.error("Update failed", { description: (error as Error).message });
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...projects];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setProjects(next);
    await api("/api/admin/projects/reorder", { json: { ids: next.map((project) => project._id) } }).catch(() =>
      toast.error("Could not save the new order")
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white">Projects</h1>
          <p className="mt-1 text-xs text-mute">Add, edit, reorder and publish the work shown on your site.</p>
        </div>
        <Button className="text-xs" onClick={() => setEditing({ ...blank })}>
          <Plus className="h-3.5 w-3.5" />
          New project
        </Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
        </div>
      ) : projects.length ? (
        <div className="space-y-3">
          {projects.map((project, index) => (
            <motion.div
              key={project._id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.03 }}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.022] p-4 transition-colors hover:border-white/[0.16]"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => void move(index, -1)}
                  disabled={index === 0}
                  className="rounded p-1 text-mute transition-colors hover:text-white disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void move(index, 1)}
                  disabled={index === projects.length - 1}
                  className="rounded p-1 text-mute transition-colors hover:text-white disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={project.cover || "/placeholders/project-cover.svg"}
                alt={project.title}
                className="h-16 w-24 shrink-0 rounded-lg border border-white/10 object-cover"
              />

              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg tracking-wide text-white">{project.title}</h3>
                  {project.featured ? (
                    <span className="rounded-full border border-[var(--accent)]/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)]">
                      featured
                    </span>
                  ) : null}
                  {!project.published ? (
                    <span className="rounded-full border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mute">
                      draft
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-mute">{project.tagline || project.summary}</p>
                <p className="mt-1 font-mono text-[10px] text-mute-soft">/work/{project.slug}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleField(project, "featured")}
                  title="Toggle featured"
                  className="rounded-lg border border-white/10 p-2.5 text-mute transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--accent)]"
                >
                  <Star className={project.featured ? "h-3.5 w-3.5 fill-[var(--accent)] text-[var(--accent)]" : "h-3.5 w-3.5"} />
                </button>
                <button
                  type="button"
                  onClick={() => void toggleField(project, "published")}
                  title="Toggle published"
                  className="rounded-lg border border-white/10 p-2.5 text-mute transition-colors hover:border-white/30 hover:text-white"
                >
                  {project.published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(project)}
                  className="rounded-lg border border-white/10 p-2.5 text-mute transition-colors hover:border-white/30 hover:text-white"
                  aria-label="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(project)}
                  className="rounded-lg border border-white/10 p-2.5 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          description="Add your first project and it appears on the site immediately."
          action={
            <Button className="text-xs" onClick={() => setEditing({ ...blank })}>
              <Plus className="h-3.5 w-3.5" />
              New project
            </Button>
          }
        />
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? "Edit project" : "New project"}
        wide
      >
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Title"
                value={editing.title ?? ""}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
              <Input
                label="Slug"
                hint="Leave blank to generate from the title"
                value={editing.slug ?? ""}
                onChange={(event) => setEditing({ ...editing, slug: event.target.value })}
              />
              <Input
                label="Tagline"
                value={editing.tagline ?? ""}
                onChange={(event) => setEditing({ ...editing, tagline: event.target.value })}
              />
              <Input
                label="Your role"
                value={editing.role ?? ""}
                onChange={(event) => setEditing({ ...editing, role: event.target.value })}
              />
              <Input
                label="Year"
                value={editing.year ?? ""}
                onChange={(event) => setEditing({ ...editing, year: event.target.value })}
              />
            </div>

            <Textarea
              label="Summary (card text)"
              rows={2}
              value={editing.summary ?? ""}
              onChange={(event) => setEditing({ ...editing, summary: event.target.value })}
            />
            <Textarea
              label="Full description (case study page)"
              rows={8}
              hint="Blank lines separate paragraphs."
              value={editing.description ?? ""}
              onChange={(event) => setEditing({ ...editing, description: event.target.value })}
            />

            <ImageField
              label="Cover image"
              value={editing.cover ?? ""}
              onChange={(url) => setEditing({ ...editing, cover: url })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <StringList
                label="Tags (used by the filter)"
                values={editing.tags ?? []}
                onChange={(values) => setEditing({ ...editing, tags: values })}
              />
              <StringList
                label="Tech stack"
                values={editing.stack ?? []}
                onChange={(values) => setEditing({ ...editing, stack: values })}
              />
            </div>

            <StringList
              label="Gallery image URLs"
              values={editing.gallery ?? []}
              onChange={(values) => setEditing({ ...editing, gallery: values })}
              placeholder="/placeholders/project-1.svg"
            />

            <div>
              <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">
                Metrics
              </span>
              <div className="space-y-2">
                {editing.metrics?.map((metric, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <Input
                      label="Label"
                      value={metric.label}
                      onChange={(event) => {
                        const metrics = [...(editing.metrics ?? [])];
                        metrics[index] = { ...metric, label: event.target.value };
                        setEditing({ ...editing, metrics });
                      }}
                      className="flex-1"
                    />
                    <Input
                      label="Value"
                      value={metric.value}
                      onChange={(event) => {
                        const metrics = [...(editing.metrics ?? [])];
                        metrics[index] = { ...metric, value: event.target.value };
                        setEditing({ ...editing, metrics });
                      }}
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({ ...editing, metrics: (editing.metrics ?? []).filter((_, i) => i !== index) })
                      }
                      className="h-10 rounded-lg border border-white/10 px-3 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                      aria-label="Remove metric"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                className="mt-2 text-xs"
                onClick={() => setEditing({ ...editing, metrics: [...(editing.metrics ?? []), { label: "", value: "" }] })}
              >
                <Plus className="h-3.5 w-3.5" />
                Add metric
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Live URL"
                value={editing.links?.live ?? ""}
                onChange={(event) =>
                  setEditing({ ...editing, links: { ...(editing.links ?? { live: "", github: "", caseStudy: "" }), live: event.target.value } })
                }
              />
              <Input
                label="GitHub URL"
                value={editing.links?.github ?? ""}
                onChange={(event) =>
                  setEditing({ ...editing, links: { ...(editing.links ?? { live: "", github: "", caseStudy: "" }), github: event.target.value } })
                }
              />
              <Input
                label="Case study URL"
                value={editing.links?.caseStudy ?? ""}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    links: { ...(editing.links ?? { live: "", github: "", caseStudy: "" }), caseStudy: event.target.value },
                  })
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                label="Featured"
                checked={Boolean(editing.featured)}
                onChange={(value) => setEditing({ ...editing, featured: value })}
              />
              <Toggle
                label="Published"
                checked={editing.published !== false}
                onChange={(value) => setEditing({ ...editing, published: value })}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} loading={saving}>
                {editing._id ? "Save changes" : "Create project"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

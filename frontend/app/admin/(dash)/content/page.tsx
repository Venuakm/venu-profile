"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { SiteContent } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button, Card, ImageField, Input, SaveBar, StringList, Textarea, Toggle } from "@/components/admin/ui";

const TABS = [
  { id: "hero", label: "Hero" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
  { id: "socials", label: "Links" },
  { id: "theme", label: "Theme & SEO" },
  { id: "json", label: "Raw JSON" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ContentPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [original, setOriginal] = useState<string>("");
  const [tab, setTab] = useState<TabId>("hero");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ content: SiteContent }>("/api/admin/content");
      setContent(data.content);
      setOriginal(JSON.stringify(data.content));
    } catch (error) {
      toast.error("Could not load content", { description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(
    () => Boolean(content) && JSON.stringify(content) !== original,
    [content, original]
  );

  /** Replaces one top-level section, leaving the rest untouched. */
  function patch<K extends keyof SiteContent>(section: K, value: SiteContent[K]) {
    setContent((current) => (current ? { ...current, [section]: value } : current));
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    try {
      await api("/api/admin/content", { method: "PUT", json: content });
      setOriginal(JSON.stringify(content));
      toast.success("Saved", { description: "The live site updates within a few seconds." });
    } catch (error) {
      toast.error("Save failed", { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function resetToDefaults() {
    if (!confirm("Reset all site content back to the shipped defaults? Your edits will be lost.")) return;
    try {
      const data = await api<{ content: SiteContent }>("/api/admin/content/reset", { method: "POST" });
      setContent(data.content);
      setOriginal(JSON.stringify(data.content));
      toast.success("Content reset to defaults");
    } catch (error) {
      toast.error("Reset failed", { description: (error as Error).message });
    }
  }

  if (loading || !content) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white">Site content</h1>
          <p className="mt-1 text-xs text-mute">Every word and image on the public site lives here.</p>
        </div>
        <Button variant="ghost" onClick={resetToDefaults} className="text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset defaults
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "relative shrink-0 rounded-xl px-4 py-2 text-xs transition-colors duration-200",
              tab === item.id ? "text-white" : "text-mute hover:text-white"
            )}
          >
            {tab === item.id ? (
              <motion.span
                layoutId="content-tab"
                className="absolute inset-0 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/12"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}
      </div>

      {tab === "hero" ? (
        <Card title="Hero" description="The first thing visitors see - your name at full volume.">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="First name (large)"
              value={content.hero.firstName}
              onChange={(event) => patch("hero", { ...content.hero, firstName: event.target.value })}
            />
            <Input
              label="Last name (accent colour)"
              value={content.hero.lastName}
              onChange={(event) => patch("hero", { ...content.hero, lastName: event.target.value })}
            />
            <Input
              label="Location"
              value={content.hero.location}
              onChange={(event) => patch("hero", { ...content.hero, location: event.target.value })}
            />
            <Input
              label="Availability label"
              value={content.hero.availability?.label ?? ""}
              onChange={(event) =>
                patch("hero", {
                  ...content.hero,
                  availability: { ...content.hero.availability, label: event.target.value },
                })
              }
            />
          </div>

          <div className="mt-4">
            <Toggle
              label="Show the green availability badge"
              checked={Boolean(content.hero.availability?.open)}
              onChange={(value) =>
                patch("hero", { ...content.hero, availability: { ...content.hero.availability, open: value } })
              }
            />
          </div>

          <div className="mt-4">
            <Textarea
              label="Tagline"
              rows={3}
              value={content.hero.tagline}
              onChange={(event) => patch("hero", { ...content.hero, tagline: event.target.value })}
            />
          </div>

          <div className="mt-4">
            <StringList
              label="Rotating job titles (typed one after another)"
              values={content.hero.roleRotation ?? []}
              onChange={(values) => patch("hero", { ...content.hero, roleRotation: values })}
              placeholder="Full Stack Developer"
            />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-3">
              <Input
                label="Primary button text"
                value={content.hero.primaryCta?.label ?? ""}
                onChange={(event) =>
                  patch("hero", { ...content.hero, primaryCta: { ...content.hero.primaryCta, label: event.target.value } })
                }
              />
              <Input
                label="Primary button link"
                value={content.hero.primaryCta?.href ?? ""}
                onChange={(event) =>
                  patch("hero", { ...content.hero, primaryCta: { ...content.hero.primaryCta, href: event.target.value } })
                }
              />
            </div>
            <div className="grid gap-3">
              <Input
                label="Secondary button text"
                value={content.hero.secondaryCta?.label ?? ""}
                onChange={(event) =>
                  patch("hero", {
                    ...content.hero,
                    secondaryCta: { ...content.hero.secondaryCta, label: event.target.value },
                  })
                }
              />
              <Input
                label="Secondary button link"
                value={content.hero.secondaryCta?.href ?? ""}
                onChange={(event) =>
                  patch("hero", {
                    ...content.hero,
                    secondaryCta: { ...content.hero.secondaryCta, href: event.target.value },
                  })
                }
              />
            </div>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <ImageField
              label="Portrait photo"
              value={content.hero.portrait}
              onChange={(url) => patch("hero", { ...content.hero, portrait: url })}
              aspect="aspect-[4/5]"
            />
            <div>
              <Input
                label="Resume link (leave blank to hide)"
                value={content.hero.resumeUrl ?? ""}
                placeholder="https://... or upload a PDF in Media"
                onChange={(event) => patch("hero", { ...content.hero, resumeUrl: event.target.value })}
              />
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">
              Stat tiles under the hero
            </p>
            <div className="space-y-3">
              {content.hero.stats?.map((stat, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-white/[0.07] p-3 sm:grid-cols-[100px_80px_1fr_auto]">
                  <Input
                    label="Value"
                    value={stat.value}
                    onChange={(event) => {
                      const stats = [...content.hero.stats];
                      stats[index] = { ...stat, value: event.target.value };
                      patch("hero", { ...content.hero, stats });
                    }}
                  />
                  <Input
                    label="Suffix"
                    value={stat.suffix}
                    onChange={(event) => {
                      const stats = [...content.hero.stats];
                      stats[index] = { ...stat, suffix: event.target.value };
                      patch("hero", { ...content.hero, stats });
                    }}
                  />
                  <Input
                    label="Label"
                    value={stat.label}
                    onChange={(event) => {
                      const stats = [...content.hero.stats];
                      stats[index] = { ...stat, label: event.target.value };
                      patch("hero", { ...content.hero, stats });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patch("hero", { ...content.hero, stats: content.hero.stats.filter((_, i) => i !== index) })
                    }
                    className="mt-5 h-10 rounded-lg border border-white/10 px-3 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                    aria-label="Remove stat"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="mt-3 text-xs"
              onClick={() =>
                patch("hero", {
                  ...content.hero,
                  stats: [...(content.hero.stats ?? []), { value: "0", suffix: "+", label: "New stat" }],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add stat
            </Button>
          </div>
        </Card>
      ) : null}

      {tab === "about" ? (
        <Card title="About" description="Your story, in your words.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Section label"
              value={content.about.kicker}
              onChange={(event) => patch("about", { ...content.about, kicker: event.target.value })}
            />
            <Input
              label="Heading"
              value={content.about.heading}
              onChange={(event) => patch("about", { ...content.about, heading: event.target.value })}
            />
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
            <ImageField
              label="About image"
              value={content.about.portrait}
              onChange={(url) => patch("about", { ...content.about, portrait: url })}
              aspect="aspect-square"
            />
            <div className="space-y-5">
              <StringList
                label="Paragraphs"
                textarea
                values={content.about.paragraphs ?? []}
                onChange={(values) => patch("about", { ...content.about, paragraphs: values })}
                placeholder="Write a paragraph..."
              />
              <StringList
                label="Highlight bullets"
                values={content.about.highlights ?? []}
                onChange={(values) => patch("about", { ...content.about, highlights: values })}
              />
            </div>
          </div>
        </Card>
      ) : null}

      {tab === "experience" ? (
        <Card
          title="Experience"
          description="Roles shown on the timeline."
          action={
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() =>
                patch("experience", {
                  ...content.experience,
                  items: [
                    {
                      id: `role-${Date.now()}`,
                      company: "New company",
                      role: "Your role",
                      period: "2026 - Present",
                      current: false,
                      location: "",
                      summary: "",
                      stack: [],
                      bullets: [],
                      logo: "/placeholders/logo-kas.svg",
                      link: "",
                    },
                    ...(content.experience.items ?? []),
                  ],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add role
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Section label"
              value={content.experience.kicker}
              onChange={(event) => patch("experience", { ...content.experience, kicker: event.target.value })}
            />
            <Input
              label="Heading"
              value={content.experience.heading}
              onChange={(event) => patch("experience", { ...content.experience, heading: event.target.value })}
            />
          </div>

          <div className="mt-6 space-y-5">
            {content.experience.items?.map((item, index) => {
              const update = (changes: Partial<typeof item>) => {
                const items = [...content.experience.items];
                items[index] = { ...item, ...changes };
                patch("experience", { ...content.experience, items });
              };
              return (
                <div key={item.id ?? index} className="rounded-2xl border border-white/[0.08] bg-ink/40 p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
                      Role {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        patch("experience", {
                          ...content.experience,
                          items: content.experience.items.filter((_, i) => i !== index),
                        })
                      }
                      className="rounded-lg border border-white/10 p-2 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                      aria-label="Remove role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Input label="Company" value={item.company} onChange={(e) => update({ company: e.target.value })} />
                    <Input label="Role" value={item.role} onChange={(e) => update({ role: e.target.value })} />
                    <Input label="Period" value={item.period} onChange={(e) => update({ period: e.target.value })} />
                    <Input label="Location" value={item.location} onChange={(e) => update({ location: e.target.value })} />
                  </div>

                  <div className="mt-3">
                    <Textarea
                      label="Summary"
                      rows={2}
                      value={item.summary}
                      onChange={(e) => update({ summary: e.target.value })}
                    />
                  </div>

                  <div className="mt-3">
                    <Toggle
                      label="This is my current role"
                      checked={item.current}
                      onChange={(value) => update({ current: value })}
                    />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
                    <ImageField
                      label="Company logo"
                      value={item.logo}
                      onChange={(url) => update({ logo: url })}
                      aspect="aspect-square"
                    />
                    <div className="space-y-4">
                      <StringList
                        label="Achievements"
                        textarea
                        values={item.bullets ?? []}
                        onChange={(values) => update({ bullets: values })}
                      />
                      <StringList
                        label="Tech stack"
                        values={item.stack ?? []}
                        onChange={(values) => update({ stack: values })}
                        placeholder="Next.js"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {tab === "skills" ? (
        <Card
          title="Skills"
          action={
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() =>
                patch("skills", {
                  ...content.skills,
                  groups: [...(content.skills.groups ?? []), { title: "New group", items: [] }],
                })
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add group
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Section label"
              value={content.skills.kicker}
              onChange={(event) => patch("skills", { ...content.skills, kicker: event.target.value })}
            />
            <Input
              label="Heading"
              value={content.skills.heading}
              onChange={(event) => patch("skills", { ...content.skills, heading: event.target.value })}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {content.skills.groups?.map((group, groupIndex) => {
              const updateGroup = (changes: Partial<typeof group>) => {
                const groups = [...content.skills.groups];
                groups[groupIndex] = { ...group, ...changes };
                patch("skills", { ...content.skills, groups });
              };
              return (
                <div key={groupIndex} className="rounded-2xl border border-white/[0.08] bg-ink/40 p-5">
                  <div className="flex items-end gap-2">
                    <Input
                      label="Group title"
                      value={group.title}
                      className="flex-1"
                      onChange={(event) => updateGroup({ title: event.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        patch("skills", {
                          ...content.skills,
                          groups: content.skills.groups.filter((_, i) => i !== groupIndex),
                        })
                      }
                      className="h-10 rounded-lg border border-white/10 px-3 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                      aria-label="Remove group"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {group.items?.map((skill, skillIndex) => (
                      <div key={skillIndex} className="flex items-center gap-2">
                        <input
                          value={skill.name}
                          onChange={(event) => {
                            const items = [...group.items];
                            items[skillIndex] = { ...skill, name: event.target.value };
                            updateGroup({ items });
                          }}
                          className="flex-1 rounded-lg border border-white/[0.09] bg-ink/60 px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]/60"
                        />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={skill.level}
                          onChange={(event) => {
                            const items = [...group.items];
                            items[skillIndex] = { ...skill, level: Number(event.target.value) };
                            updateGroup({ items });
                          }}
                          className="w-24 accent-[var(--accent)]"
                        />
                        <span className="w-10 text-right font-mono text-[11px] text-mute">{skill.level}%</span>
                        <button
                          type="button"
                          onClick={() => updateGroup({ items: group.items.filter((_, i) => i !== skillIndex) })}
                          className="rounded-lg border border-white/10 p-2 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                          aria-label="Remove skill"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    className="mt-3 text-xs"
                    onClick={() => updateGroup({ items: [...(group.items ?? []), { name: "New skill", level: 70 }] })}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add skill
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {tab === "education" ? (
        <Card title="Education & achievements">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Section label"
              value={content.education.kicker}
              onChange={(event) => patch("education", { ...content.education, kicker: event.target.value })}
            />
            <Input
              label="Heading"
              value={content.education.heading}
              onChange={(event) => patch("education", { ...content.education, heading: event.target.value })}
            />
          </div>

          <div className="mt-6 space-y-4">
            {content.education.items?.map((item, index) => {
              const update = (changes: Partial<typeof item>) => {
                const items = [...content.education.items];
                items[index] = { ...item, ...changes };
                patch("education", { ...content.education, items });
              };
              return (
                <div key={index} className="rounded-2xl border border-white/[0.08] bg-ink/40 p-5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="School" value={item.school} onChange={(e) => update({ school: e.target.value })} />
                    <Input label="Degree" value={item.degree} onChange={(e) => update({ degree: e.target.value })} />
                    <Input label="Period" value={item.period} onChange={(e) => update({ period: e.target.value })} />
                  </div>
                  <div className="mt-3">
                    <Textarea label="Detail" rows={2} value={item.detail} onChange={(e) => update({ detail: e.target.value })} />
                  </div>
                  <Button
                    variant="danger"
                    className="mt-3 text-xs"
                    onClick={() =>
                      patch("education", {
                        ...content.education,
                        items: content.education.items.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>

          <Button
            variant="ghost"
            className="mt-4 text-xs"
            onClick={() =>
              patch("education", {
                ...content.education,
                items: [...(content.education.items ?? []), { school: "", degree: "", period: "", detail: "" }],
              })
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add education
          </Button>

          <div className="mt-6">
            <StringList
              label="Achievements"
              values={content.education.achievements ?? []}
              onChange={(values) => patch("education", { ...content.education, achievements: values })}
            />
          </div>
        </Card>
      ) : null}

      {tab === "contact" ? (
        <Card title="Contact" description="Where enquiries land and what visitors see.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Section label"
              value={content.contact.kicker}
              onChange={(event) => patch("contact", { ...content.contact, kicker: event.target.value })}
            />
            <Input
              label="Heading"
              value={content.contact.heading}
              onChange={(event) => patch("contact", { ...content.contact, heading: event.target.value })}
            />
            <Input
              label="Email"
              value={content.contact.email}
              onChange={(event) => patch("contact", { ...content.contact, email: event.target.value })}
            />
            <Input
              label="Phone"
              value={content.contact.phone}
              onChange={(event) => patch("contact", { ...content.contact, phone: event.target.value })}
            />
            <Input
              label="Location"
              value={content.contact.location}
              onChange={(event) => patch("contact", { ...content.contact, location: event.target.value })}
            />
            <Input
              label="Response time"
              value={content.contact.responseTime}
              onChange={(event) => patch("contact", { ...content.contact, responseTime: event.target.value })}
            />
          </div>

          <div className="mt-4 space-y-4">
            <Textarea
              label="Subheading"
              rows={2}
              value={content.contact.subheading}
              onChange={(event) => patch("contact", { ...content.contact, subheading: event.target.value })}
            />
            <Input
              label="Availability note"
              value={content.contact.availability}
              onChange={(event) => patch("contact", { ...content.contact, availability: event.target.value })}
            />
            <Input
              label="Form footnote"
              value={content.contact.formNote}
              onChange={(event) => patch("contact", { ...content.contact, formNote: event.target.value })}
            />
            <StringList
              label="Subject options in the form"
              values={content.contact.subjects ?? []}
              onChange={(values) => patch("contact", { ...content.contact, subjects: values })}
            />
          </div>
        </Card>
      ) : null}

      {tab === "socials" ? (
        <Card
          title="Links"
          description="Icons available: github, linkedin, mail, code, terminal."
          action={
            <Button
              variant="ghost"
              className="text-xs"
              onClick={() => patch("socials", [...(content.socials ?? []), { label: "", url: "", icon: "github" }])}
            >
              <Plus className="h-3.5 w-3.5" />
              Add link
            </Button>
          }
        >
          <div className="space-y-3">
            {content.socials?.map((social, index) => {
              const update = (changes: Partial<typeof social>) => {
                const socials = [...content.socials];
                socials[index] = { ...social, ...changes };
                patch("socials", socials);
              };
              return (
                <div key={index} className="grid gap-2 rounded-xl border border-white/[0.07] p-3 sm:grid-cols-[1fr_2fr_140px_auto]">
                  <Input label="Label" value={social.label} onChange={(e) => update({ label: e.target.value })} />
                  <Input label="URL" value={social.url} onChange={(e) => update({ url: e.target.value })} />
                  <Input label="Icon" value={social.icon} onChange={(e) => update({ icon: e.target.value })} />
                  <button
                    type="button"
                    onClick={() => patch("socials", content.socials.filter((_, i) => i !== index))}
                    className="mt-5 h-10 rounded-lg border border-white/10 px-3 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                    aria-label="Remove link"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-white/[0.07] pt-6">
            <h3 className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">Navigation</h3>
            <div className="space-y-3">
              {content.nav.links?.map((link, index) => {
                const update = (changes: Partial<typeof link>) => {
                  const links = [...content.nav.links];
                  links[index] = { ...link, ...changes };
                  patch("nav", { ...content.nav, links });
                };
                return (
                  <div key={index} className="grid gap-2 rounded-xl border border-white/[0.07] p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Input label="Label" value={link.label} onChange={(e) => update({ label: e.target.value })} />
                    <Input label="Anchor" value={link.href} onChange={(e) => update({ href: e.target.value })} />
                    <button
                      type="button"
                      onClick={() =>
                        patch("nav", { ...content.nav, links: content.nav.links.filter((_, i) => i !== index) })
                      }
                      className="mt-5 h-10 rounded-lg border border-white/10 px-3 text-mute transition-colors hover:border-red-500/40 hover:text-red-300"
                      aria-label="Remove nav link"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Input
                label="Logo text"
                value={content.nav.logoText}
                onChange={(event) => patch("nav", { ...content.nav, logoText: event.target.value })}
              />
              <Input
                label="Logo mark"
                value={content.nav.logoMark}
                onChange={(event) => patch("nav", { ...content.nav, logoMark: event.target.value })}
              />
              <Input
                label="Admin button label"
                value={content.nav.adminLabel}
                onChange={(event) => patch("nav", { ...content.nav, adminLabel: event.target.value })}
              />
            </div>
          </div>
        </Card>
      ) : null}

      {tab === "theme" ? (
        <div className="space-y-5">
          <Card title="Theme" description="Colour and motion for the whole site.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">
                  Accent colour
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={content.theme.accent}
                    onChange={(event) => patch("theme", { ...content.theme, accent: event.target.value })}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    value={content.theme.accent}
                    onChange={(event) => patch("theme", { ...content.theme, accent: event.target.value })}
                    className="flex-1 rounded-xl border border-white/[0.09] bg-ink/60 px-4 text-sm text-white outline-none focus:border-[var(--accent)]/60"
                  />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.18em] text-mute-soft">
                  Accent glow
                </span>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={content.theme.accentGlow}
                    onChange={(event) => patch("theme", { ...content.theme, accentGlow: event.target.value })}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  />
                  <input
                    value={content.theme.accentGlow}
                    onChange={(event) => patch("theme", { ...content.theme, accentGlow: event.target.value })}
                    className="flex-1 rounded-xl border border-white/[0.09] bg-ink/60 px-4 text-sm text-white outline-none focus:border-[var(--accent)]/60"
                  />
                </div>
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Toggle
                label="Cursor glow"
                checked={content.theme.cursorGlow !== false}
                onChange={(value) => patch("theme", { ...content.theme, cursorGlow: value })}
              />
              <Toggle
                label="Animated background"
                checked={content.theme.animatedBackground !== false}
                onChange={(value) => patch("theme", { ...content.theme, animatedBackground: value })}
              />
              <Toggle
                label="Film grain"
                checked={content.theme.grain !== false}
                onChange={(value) => patch("theme", { ...content.theme, grain: value })}
              />
            </div>
          </Card>

          <Card title="SEO" description="How the site appears in search results and link previews.">
            <div className="space-y-4">
              <Input
                label="Page title"
                value={content.meta.title}
                onChange={(event) => patch("meta", { ...content.meta, title: event.target.value })}
              />
              <Textarea
                label="Meta description"
                rows={2}
                value={content.meta.description}
                onChange={(event) => patch("meta", { ...content.meta, description: event.target.value })}
              />
              <StringList
                label="Keywords"
                values={content.meta.keywords ?? []}
                onChange={(values) => patch("meta", { ...content.meta, keywords: values })}
              />
              <ImageField
                label="Social share image"
                value={content.meta.ogImage}
                onChange={(url) => patch("meta", { ...content.meta, ogImage: url })}
              />
            </div>
          </Card>

          <Card title="Footer">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Copyright name"
                value={content.footer.copyright}
                onChange={(event) => patch("footer", { ...content.footer, copyright: event.target.value })}
              />
              <Input
                label="Back-to-top label"
                value={content.footer.backToTop}
                onChange={(event) => patch("footer", { ...content.footer, backToTop: event.target.value })}
              />
            </div>
            <div className="mt-4">
              <Textarea
                label="Footer note"
                rows={2}
                value={content.footer.note}
                onChange={(event) => patch("footer", { ...content.footer, note: event.target.value })}
              />
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "json" ? (
        <Card title="Raw JSON" description="Full control. Invalid JSON is rejected before saving.">
          <Textarea
            rows={26}
            className="font-mono text-xs"
            defaultValue={JSON.stringify(content, null, 2)}
            onBlur={(event) => {
              try {
                setContent(JSON.parse(event.target.value));
                toast.success("JSON parsed - press save to apply");
              } catch {
                toast.error("That is not valid JSON");
              }
            }}
          />
        </Card>
      ) : null}

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={save}
        onReset={() => {
          setContent(JSON.parse(original));
          toast("Changes discarded");
        }}
      />
    </div>
  );
}

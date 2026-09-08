"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUp,
  Clock,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
  Code2,
  Terminal,
  Loader2,
} from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { api } from "@/lib/api";
import { EASE, Magnetic, Reveal, SectionHeading } from "./primitives";

const ICONS: Record<string, typeof Github> = {
  github: Github,
  linkedin: Linkedin,
  mail: Mail,
  code: Code2,
  terminal: Terminal,
};

export function Contact({
  contact,
  socials,
}: {
  contact: SiteContent["contact"];
  socials: SiteContent["socials"];
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    setSending(true);
    try {
      await api<{ ok: boolean; message: string }>("/api/contact", { json: data });
      toast.success("Message sent", { description: "Thanks - I'll reply within 24 hours." });
      form.reset();
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (error) {
      toast.error("Could not send", { description: (error as Error).message });
    } finally {
      setSending(false);
    }
  }

  const details = [
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    { icon: Phone, label: "Phone", value: contact.phone, href: `tel:${contact.phone?.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Location", value: contact.location, href: "" },
    { icon: Clock, label: "Response time", value: contact.responseTime, href: "" },
  ].filter((detail) => detail.value);

  return (
    <section id="contact" className="relative z-10 py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading kicker={contact.kicker} heading={contact.heading} subheading={contact.subheading} />

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <form
              onSubmit={onSubmit}
              className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025] p-6 backdrop-blur-xl sm:p-8"
            >
              <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[var(--accent)]/12 blur-3xl" />

              <h3 className="relative font-mono text-xs uppercase tracking-[0.26em] text-white/80">
                Send a message
              </h3>

              <div className="relative mt-7 grid gap-4 sm:grid-cols-2">
                <Field name="name" label="Your name" placeholder="Jane Doe" required />
                <Field name="email" label="Email address" type="email" placeholder="jane@company.com" required />
                <Field name="company" label="Company" placeholder="Optional" />
                <SelectField name="subject" label="Subject" options={contact.subjects ?? []} />
              </div>

              <div className="relative mt-4">
                <TextareaField name="message" label="Your message" placeholder="Tell me about the project..." required />
              </div>

              {/* Honeypot - hidden from people, irresistible to bots. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />

              <div className="relative mt-7 flex flex-wrap items-center gap-4">
                <Magnetic strength={0.18}>
                  <button
                    type="submit"
                    disabled={sending}
                    data-cursor
                    className="group relative flex items-center gap-3 overflow-hidden rounded-xl bg-[var(--accent)] px-7 py-4 text-sm font-semibold text-white accent-glow disabled:opacity-70"
                  >
                    <span className="relative z-10">
                      {sending ? "Sending..." : sent ? "Message sent" : "Send message"}
                    </span>
                    {sending ? (
                      <Loader2 className="relative z-10 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    )}
                    <span className="absolute inset-0 -translate-x-full bg-white/25 transition-transform duration-500 group-hover:translate-x-full" />
                  </button>
                </Magnetic>
                {contact.formNote ? <p className="text-xs text-mute-soft">{contact.formNote}</p> : null}
              </div>
            </form>
          </Reveal>

          <div className="space-y-4">
            {details.map((detail, index) => {
              const Icon = detail.icon;
              const inner = (
                <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5 transition-all duration-300 hover:border-[var(--accent)]/35 hover:bg-[var(--accent)]/[0.05]">
                  <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--accent)]/40 text-[var(--accent)]">
                    <Icon className="h-4 w-4" />
                    <span className="absolute inset-0 rounded-full border border-[var(--accent)]/40 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-soft">
                      {detail.label}
                    </div>
                    <div className="truncate text-sm text-white/90">{detail.value}</div>
                  </div>
                </div>
              );
              return (
                <Reveal key={detail.label} delay={index * 0.07}>
                  {detail.href ? <a href={detail.href}>{inner}</a> : inner}
                </Reveal>
              );
            })}

            {socials?.length ? (
              <Reveal delay={0.3}>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.022] p-5">
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute-soft">Elsewhere</div>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {socials.map((social) => {
                      const Icon = ICONS[social.icon] ?? Globe2Fallback;
                      return (
                        <a
                          key={social.label}
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          title={social.label}
                          className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.09] text-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                        >
                          <Icon className="h-4 w-4" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            ) : null}

            {contact.availability ? (
              <Reveal delay={0.36}>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                      Availability
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/80">{contact.availability}</p>
                </div>
              </Reveal>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Globe2Fallback(props: React.SVGProps<SVGSVGElement>) {
  return <Mail {...props} />;
}

const fieldClass =
  "peer w-full rounded-xl border border-white/[0.09] bg-ink/60 px-4 pb-2.5 pt-6 text-sm text-white outline-none transition-colors duration-300 placeholder:text-transparent focus:border-[var(--accent)]/60 focus:bg-ink/80";
const labelClass =
  "pointer-events-none absolute left-4 top-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute-soft transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:top-2 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-[0.16em] peer-focus:text-[var(--accent)]";

function Field({
  name,
  label,
  type = "text",
  placeholder,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <input id={name} name={name} type={type} placeholder={placeholder ?? label} required={required} className={fieldClass} />
      <label htmlFor={name} className={labelClass}>
        {label}
        {required ? " *" : ""}
      </label>
    </div>
  );
}

function TextareaField({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <textarea
        id={name}
        name={name}
        rows={5}
        placeholder={placeholder ?? label}
        required={required}
        className={`${fieldClass} resize-none`}
      />
      <label htmlFor={name} className={labelClass}>
        {label}
        {required ? " *" : ""}
      </label>
    </div>
  );
}

function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <div className="relative">
      <select
        id={name}
        name={name}
        defaultValue=""
        className="w-full appearance-none rounded-xl border border-white/[0.09] bg-ink/60 px-4 pb-2.5 pt-6 text-sm text-white outline-none transition-colors duration-300 focus:border-[var(--accent)]/60"
      >
        <option value="">Choose one</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute left-4 top-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute-soft">
        {label}
      </span>
    </div>
  );
}

export function Footer({
  footer,
  socials,
  name,
}: {
  footer: SiteContent["footer"];
  socials: SiteContent["socials"];
  name: string;
}) {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-white/[0.07] pt-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8 pb-12">
          <div>
            <h2 className="font-display text-[clamp(2.4rem,9vw,6rem)] leading-none tracking-tight text-white/[0.09] outline-text">
              {name}
            </h2>
            {footer.note ? <p className="mt-4 max-w-md text-sm text-mute">{footer.note}</p> : null}
          </div>

          <Magnetic strength={0.2}>
            <a
              href="#home"
              data-cursor
              className="group flex items-center gap-3 rounded-full border border-white/12 px-5 py-3 text-sm text-white/80 transition-colors duration-300 hover:border-[var(--accent)] hover:text-white"
            >
              {footer.backToTop || "Back to top"}
              <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <ArrowUp className="h-4 w-4" />
              </motion.span>
            </a>
          </Magnetic>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] py-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute-soft">
            &copy; {new Date().getFullYear()} {footer.copyright}
          </p>
          <div className="flex gap-4">
            {socials?.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-mute transition-colors hover:text-[var(--accent)]"
              >
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <motion.div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASE }}
      />
    </footer>
  );
}

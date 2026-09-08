import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Project } from "../models/Project.js";
import { requireAuth } from "../plugins/auth.js";
import { notify } from "../lib/notify.js";

const projectInput = z.object({
  title: z.string().min(1).max(160),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug can contain lowercase letters, numbers and dashes only")
    .optional(),
  tagline: z.string().max(240).optional(),
  summary: z.string().max(600).optional(),
  description: z.string().max(20000).optional(),
  cover: z.string().max(600).optional(),
  gallery: z.array(z.string().max(600)).max(24).optional(),
  tags: z.array(z.string().max(60)).max(20).optional(),
  stack: z.array(z.string().max(60)).max(40).optional(),
  role: z.string().max(160).optional(),
  year: z.string().max(20).optional(),
  metrics: z.array(z.object({ label: z.string().max(80), value: z.string().max(80) })).max(12).optional(),
  links: z
    .object({
      live: z.string().max(500).optional(),
      github: z.string().max(500).optional(),
      caseStudy: z.string().max(500).optional(),
    })
    .optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  order: z.number().int().min(0).max(9999).optional(),
  accent: z.string().max(40).optional(),
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export async function projectRoutes(app: FastifyInstance) {
  /** Public list - published only. */
  app.get("/projects", async (request) => {
    const query = request.query as { featured?: string; limit?: string };
    const filter: Record<string, unknown> = { published: true };
    if (query.featured === "true") filter.featured = true;
    const projects = await Project.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .limit(Math.min(Number(query.limit ?? 50), 100))
      .lean();
    return { projects };
  });

  app.get("/projects/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const project = await Project.findOne({ slug, published: true }).lean();
    if (!project) return reply.code(404).send({ error: "Project not found" });
    return { project };
  });

  /** Admin list - includes drafts. */
  app.get("/admin/projects", { preHandler: requireAuth }, async () => {
    const projects = await Project.find().sort({ order: 1, createdAt: -1 }).lean();
    return { projects };
  });

  app.post("/admin/projects", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = projectInput.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid project" });
    }
    const slug = parsed.data.slug ?? slugify(parsed.data.title);
    const exists = await Project.findOne({ slug });
    if (exists) return reply.code(409).send({ error: "A project with that slug already exists" });

    const count = await Project.countDocuments();
    const project = await Project.create({ ...parsed.data, slug, order: parsed.data.order ?? count + 1 });

    await notify({
      type: "project",
      level: "success",
      title: "Project created",
      body: project.title,
      href: `/admin/projects/${project.slug}`,
    });
    return reply.code(201).send({ project });
  });

  app.patch("/admin/projects/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = projectInput.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Invalid project" });
    }
    if (parsed.data.slug) {
      const clash = await Project.findOne({ slug: parsed.data.slug, _id: { $ne: id } });
      if (clash) return reply.code(409).send({ error: "That slug is already in use" });
    }
    const project = await Project.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
    if (!project) return reply.code(404).send({ error: "Project not found" });

    await notify({ type: "project", title: "Project updated", body: project.title });
    return { project };
  });

  app.delete("/admin/projects/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await Project.findByIdAndDelete(id);
    if (!project) return reply.code(404).send({ error: "Project not found" });
    await notify({ type: "project", level: "warning", title: "Project deleted", body: project.title });
    return { ok: true };
  });

  /** Drag-and-drop reordering. */
  app.post("/admin/projects/reorder", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({ ids: z.array(z.string().min(1)).max(200) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Expected an array of project ids" });

    await Promise.all(
      parsed.data.ids.map((id, index) => Project.updateOne({ _id: id }, { $set: { order: index + 1 } }))
    );
    return { ok: true };
  });
}

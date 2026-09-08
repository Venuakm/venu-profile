import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Content } from "../models/Content.js";
import { defaultContent } from "../lib/defaultContent.js";
import { requireAuth } from "../plugins/auth.js";
import { notify } from "../lib/notify.js";
import { emitLive } from "../lib/events.js";

type Json = Record<string, unknown>;

/** Recursive merge so the dashboard can PATCH a single nested field. */
function deepMerge<T extends Json>(base: T, patch: Json): T {
  const out: Json = Array.isArray(base) ? [...(base as unknown as unknown[])] as unknown as Json : { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = (out as Json)[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      out[key] = deepMerge(current as Json, value as Json);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

/** Sets a dotted path (`hero.stats.0.label`) inside the content document. */
function setPath(target: Json, path: string, value: unknown): void {
  const parts = path.split(".").filter(Boolean);
  let node: any = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    if (node[key] == null || typeof node[key] !== "object") {
      node[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
}

export async function getOrCreateContent() {
  let doc = await Content.findOne({ key: "main" });
  if (!doc) {
    doc = await Content.create({ key: "main", data: defaultContent });
  }
  return doc;
}

export async function contentRoutes(app: FastifyInstance) {
  /** Public: the entire site copy. */
  app.get("/content", async () => {
    const doc = await getOrCreateContent();
    return { content: doc.data, updatedAt: doc.updatedAt, version: doc.version };
  });

  app.get("/admin/content", { preHandler: requireAuth }, async () => {
    const doc = await getOrCreateContent();
    return { content: doc.data, updatedAt: doc.updatedAt, version: doc.version };
  });

  /** Partial update, merged into the existing document. */
  app.patch("/admin/content", { preHandler: requireAuth }, async (request, reply) => {
    const body = request.body as Json;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return reply.code(400).send({ error: "Expected an object of fields to update" });
    }
    const doc = await getOrCreateContent();
    doc.data = deepMerge((doc.data ?? {}) as Json, body);
    doc.version += 1;
    doc.updatedBy = request.admin!.email;
    doc.markModified("data");
    await doc.save();

    emitLive({ channel: "content", payload: { version: doc.version } });
    return { content: doc.data, version: doc.version };
  });

  /** Single-field update, used by the inline editor. */
  app.post("/admin/content/field", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({ path: z.string().min(1).max(200), value: z.unknown() });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "A path and value are required" });

    const doc = await getOrCreateContent();
    const data = { ...((doc.data ?? {}) as Json) };
    setPath(data, parsed.data.path, parsed.data.value);
    doc.data = data;
    doc.version += 1;
    doc.updatedBy = request.admin!.email;
    doc.markModified("data");
    await doc.save();

    emitLive({ channel: "content", payload: { version: doc.version, path: parsed.data.path } });
    return { ok: true, version: doc.version, path: parsed.data.path };
  });

  /** Full replace - used by the raw JSON editor. */
  app.put("/admin/content", { preHandler: requireAuth }, async (request, reply) => {
    const body = request.body as Json;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return reply.code(400).send({ error: "Expected a content object" });
    }
    const doc = await getOrCreateContent();
    doc.data = body;
    doc.version += 1;
    doc.updatedBy = request.admin!.email;
    doc.markModified("data");
    await doc.save();

    await notify({ type: "content", title: "Site content replaced", body: `Version ${doc.version}` });
    return { content: doc.data, version: doc.version };
  });

  /** Restores the shipped defaults. */
  app.post("/admin/content/reset", { preHandler: requireAuth }, async (request) => {
    const doc = await getOrCreateContent();
    doc.data = defaultContent;
    doc.version += 1;
    doc.updatedBy = request.admin!.email;
    doc.markModified("data");
    await doc.save();
    await notify({ type: "content", level: "warning", title: "Content reset to defaults" });
    return { content: doc.data, version: doc.version };
  });
}

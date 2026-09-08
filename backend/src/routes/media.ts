import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Media } from "../models/Media.js";
import { requireAuth } from "../plugins/auth.js";
import { env } from "../config/env.js";
import { notify } from "../lib/notify.js";
import { deleteStored, isCloudinaryEnabled, storeUpload } from "../lib/storage.js";

const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
  ["image/svg+xml", ".svg"],
  ["application/pdf", ".pdf"],
]);

export async function mediaRoutes(app: FastifyInstance) {
  app.get("/admin/media", { preHandler: requireAuth }, async (request) => {
    const query = request.query as { folder?: string; limit?: string };
    const filter: Record<string, unknown> = {};
    if (query.folder && query.folder !== "all") filter.folder = query.folder;
    const media = await Media.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(query.limit ?? 100), 200))
      .lean();
    return { media, storage: isCloudinaryEnabled() ? "cloudinary" : "local" };
  });

  /** Multipart upload. Type and size are enforced before anything is stored. */
  app.post("/admin/media", { preHandler: requireAuth }, async (request, reply) => {
    const file = await request.file({ limits: { fileSize: env.maxUploadMb * 1024 * 1024 } });
    if (!file) return reply.code(400).send({ error: "No file received" });

    const extension = ALLOWED.get(file.mimetype);
    if (!extension) {
      return reply.code(415).send({ error: `Unsupported file type: ${file.mimetype}` });
    }

    const folder = String((file.fields?.folder as any)?.value ?? "general").replace(/[^a-z0-9-]/gi, "") || "general";

    let stored;
    try {
      stored = await storeUpload(file.file, {
        mimetype: file.mimetype,
        extension,
        folder,
        originalName: file.filename,
      });
    } catch (error) {
      const message = (error as Error).message;
      const tooLarge = message.includes("must be under") || message.includes("File size too large");
      return reply.code(tooLarge ? 413 : 500).send({ error: tooLarge ? message : "Upload failed" });
    }

    const doc = await Media.create({
      filename: stored.filename,
      originalName: file.filename,
      url: stored.url,
      provider: stored.provider,
      publicId: stored.publicId ?? null,
      mime: file.mimetype,
      size: stored.bytes || file.file.bytesRead,
      folder,
      alt: String((file.fields?.alt as any)?.value ?? ""),
    });

    await notify({ type: "media", title: "Image uploaded", body: file.filename, level: "success" });
    return reply.code(201).send({ media: doc });
  });

  app.patch("/admin/media/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({ alt: z.string().max(300).optional(), folder: z.string().max(60).optional() });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid media update" });
    const media = await Media.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
    if (!media) return reply.code(404).send({ error: "Media not found" });
    return { media };
  });

  app.delete("/admin/media/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const media = await Media.findByIdAndDelete(id);
    if (!media) return reply.code(404).send({ error: "Media not found" });
    await deleteStored({ provider: media.provider, publicId: media.publicId, filename: media.filename });
    return { ok: true };
  });
}

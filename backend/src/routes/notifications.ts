import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Notification } from "../models/Notification.js";
import { requireAuth } from "../plugins/auth.js";
import { bus, type LiveEvent } from "../lib/events.js";
import { notify } from "../lib/notify.js";

export async function notificationRoutes(app: FastifyInstance) {
  app.get("/admin/notifications", { preHandler: requireAuth }, async (request) => {
    const query = request.query as { limit?: string; unread?: string; type?: string };
    const filter: Record<string, unknown> = {};
    if (query.unread === "true") filter.read = false;
    if (query.type && query.type !== "all") filter.type = query.type;

    const [notifications, unread] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(Number(query.limit ?? 40), 100))
        .lean(),
      Notification.countDocuments({ read: false }),
    ]);
    return { notifications, unread };
  });

  app.post("/admin/notifications/:id/read", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const doc = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true, readAt: new Date() } },
      { new: true }
    );
    if (!doc) return reply.code(404).send({ error: "Notification not found" });
    return { notification: doc };
  });

  app.post("/admin/notifications/read-all", { preHandler: requireAuth }, async () => {
    await Notification.updateMany({ read: false }, { $set: { read: true, readAt: new Date() } });
    return { ok: true };
  });

  app.delete("/admin/notifications/:id", { preHandler: requireAuth }, async (request) => {
    const { id } = request.params as { id: string };
    await Notification.findByIdAndDelete(id);
    return { ok: true };
  });

  app.delete("/admin/notifications", { preHandler: requireAuth }, async () => {
    await Notification.deleteMany({ read: true });
    return { ok: true };
  });

  /** Lets the owner fire a test notification from the dashboard. */
  app.post("/admin/notifications/test", { preHandler: requireAuth }, async (request, reply) => {
    const schema = z.object({
      title: z.string().min(1).max(160).default("Test notification"),
      body: z.string().max(400).default("If you can see this, live notifications are working."),
      level: z.enum(["info", "success", "warning", "critical"]).default("info"),
    });
    const parsed = schema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: "Invalid notification" });
    const doc = await notify({ type: "system", ...parsed.data });
    return { notification: doc };
  });

  /**
   * Server-sent events stream. The dashboard subscribes once and receives every
   * new notification and message the moment it is created.
   */
  app.get("/admin/stream", { preHandler: requireAuth }, async (request, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    reply.raw.write(`event: ready\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    const onLive = (event: LiveEvent) => {
      reply.raw.write(`event: ${event.channel}\ndata: ${JSON.stringify(event.payload)}\n\n`);
    };
    bus.on("live", onLive);

    // Keeps proxies from dropping an idle connection.
    const heartbeat = setInterval(() => reply.raw.write(": ping\n\n"), 25000);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
      bus.off("live", onLive);
    });

    return reply;
  });
}

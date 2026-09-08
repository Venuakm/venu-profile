import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { Message } from "../models/Message.js";
import { requireAuth } from "../plugins/auth.js";
import { notify } from "../lib/notify.js";
import { emitLive } from "../lib/events.js";
import { autoReplyTemplate, contactNotificationTemplate, replyTemplate, sendMail } from "../lib/mailer.js";
import { env } from "../config/env.js";

const contactSchema = z.object({
  name: z.string().min(2, "Tell me your name").max(120),
  email: z.string().email("That email doesn't look right").max(200),
  subject: z.string().max(200).optional().default(""),
  message: z.string().min(10, "A little more detail, please").max(5000),
  company: z.string().max(160).optional().default(""),
  budget: z.string().max(80).optional().default(""),
  // Honeypot: bots fill hidden fields, humans never see them.
  website: z.string().max(200).optional().default(""),
});

export async function messageRoutes(app: FastifyInstance) {
  /** Public contact form. */
  app.post(
    "/contact",
    { config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const parsed = contactSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? "Please check the form" });
      }
      const data = parsed.data;

      // Silently accept honeypot hits so bots do not learn they were caught.
      if (data.website) return { ok: true };

      const message = await Message.create({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        company: data.company,
        budget: data.budget,
        ip: request.ip,
        userAgent: String(request.headers["user-agent"] ?? ""),
      });

      emitLive({ channel: "message", payload: message.toObject() });
      await notify({
        type: "message",
        level: "success",
        title: `New message from ${data.name}`,
        body: data.subject || data.message.slice(0, 120),
        href: "/admin/messages",
        meta: { messageId: String(message._id), email: data.email },
      });

      // Notify the owner, then acknowledge the sender. Never block the response.
      void sendMail({
        to: env.smtp.to,
        subject: `Portfolio enquiry - ${data.name}${data.subject ? ` - ${data.subject}` : ""}`,
        html: contactNotificationTemplate(data),
        text: `${data.name} <${data.email}>\n\n${data.message}`,
        replyTo: data.email,
      });
      void sendMail({
        to: data.email,
        subject: "Thanks for reaching out - Venu Akkamgari",
        html: autoReplyTemplate(data.name),
        text: `Hi ${data.name}, thanks for reaching out. I usually reply within 24 hours. - Venu`,
      });

      return { ok: true, message: "Message received. I'll get back to you shortly." };
    }
  );

  app.get("/admin/messages", { preHandler: requireAuth }, async (request) => {
    const query = request.query as { status?: string; limit?: string; skip?: string; q?: string };
    const filter: Record<string, unknown> = {};
    if (query.status && query.status !== "all") filter.status = query.status;
    if (query.q) {
      filter.$or = [
        { name: { $regex: query.q, $options: "i" } },
        { email: { $regex: query.q, $options: "i" } },
        { message: { $regex: query.q, $options: "i" } },
      ];
    }
    const [messages, total, unread] = await Promise.all([
      Message.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(query.skip ?? 0))
        .limit(Math.min(Number(query.limit ?? 50), 100))
        .lean(),
      Message.countDocuments(filter),
      Message.countDocuments({ status: "new" }),
    ]);
    return { messages, total, unread };
  });

  app.patch("/admin/messages/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({
      status: z.enum(["new", "read", "replied", "archived"]).optional(),
      starred: z.boolean().optional(),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid update" });

    const message = await Message.findByIdAndUpdate(id, { $set: parsed.data }, { new: true });
    if (!message) return reply.code(404).send({ error: "Message not found" });
    return { message };
  });

  /** Reply straight from the dashboard. */
  app.post("/admin/messages/:id/reply", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const schema = z.object({ body: z.string().min(1).max(5000) });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Write a reply first" });

    const message = await Message.findById(id);
    if (!message) return reply.code(404).send({ error: "Message not found" });

    const result = await sendMail({
      to: message.email,
      subject: `Re: ${message.subject || "your message"}`,
      html: replyTemplate(parsed.data.body),
      text: parsed.data.body,
    });

    message.replies.push({ body: parsed.data.body, sentAt: new Date(), delivered: result.delivered });
    message.status = "replied";
    await message.save();

    return { ok: true, delivered: result.delivered, reason: result.reason, message };
  });

  app.delete("/admin/messages/:id", { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return reply.code(404).send({ error: "Message not found" });
    return { ok: true };
  });

  /** Dashboard summary tiles. */
  app.get("/admin/stats", { preHandler: requireAuth }, async () => {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [total, unread, replied, last30] = await Promise.all([
      Message.countDocuments(),
      Message.countDocuments({ status: "new" }),
      Message.countDocuments({ status: "replied" }),
      Message.countDocuments({ createdAt: { $gte: since } }),
    ]);

    const daily = await Message.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    return { messages: { total, unread, replied, last30 }, daily };
  });
}

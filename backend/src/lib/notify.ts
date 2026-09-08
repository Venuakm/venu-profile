import { Notification } from "../models/Notification.js";
import { emitLive } from "./events.js";

type NotifyInput = {
  type: "message" | "auth" | "content" | "project" | "system" | "media";
  title: string;
  body?: string;
  href?: string;
  level?: "info" | "success" | "warning" | "critical";
  meta?: Record<string, unknown>;
};

/** Persists a notification and pushes it to any live dashboard immediately. */
export async function notify(input: NotifyInput) {
  const doc = await Notification.create({
    type: input.type,
    title: input.title,
    body: input.body ?? "",
    href: input.href ?? "",
    level: input.level ?? "info",
    meta: input.meta ?? {},
  });
  emitLive({ channel: "notification", payload: doc.toObject() });
  return doc;
}

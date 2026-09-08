import { EventEmitter } from "node:events";

/** In-process bus that pushes live notifications to connected dashboards (SSE). */
export const bus = new EventEmitter();
bus.setMaxListeners(50);

export type LiveEvent =
  | { channel: "notification"; payload: unknown }
  | { channel: "message"; payload: unknown }
  | { channel: "content"; payload: unknown };

export function emitLive(event: LiveEvent): void {
  bus.emit("live", event);
}

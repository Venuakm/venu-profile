import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/server.js";

/**
 * Serverless entry point.
 *
 * The Fastify app is built once per warm instance and reused; requests are
 * handed to its internal HTTP server rather than starting a listener.
 */
let ready: Promise<Awaited<ReturnType<typeof buildApp>>> | null = null;

async function getApp() {
  if (!ready) {
    ready = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return ready;
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  const app = await getApp();
  app.server.emit("request", request, response);
}

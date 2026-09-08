import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import mongoose from "mongoose";
import { mkdir } from "node:fs/promises";

import { env } from "./config/env.js";
import { connectDbWithRetry, isDbReady } from "./db.js";
import { requireCsrfHeader } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";
import { contentRoutes, getOrCreateContent } from "./routes/content.js";
import { projectRoutes } from "./routes/projects.js";
import { messageRoutes } from "./routes/messages.js";
import { notificationRoutes } from "./routes/notifications.js";
import { mediaRoutes } from "./routes/media.js";
import { Project } from "./models/Project.js";
import { defaultProjects } from "./lib/defaultContent.js";

const app = Fastify({
  trustProxy: true,
  bodyLimit: 2 * 1024 * 1024,
  logger: env.isProd
    ? { level: "info" }
    : {
        level: "info",
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname,reqId,responseTime" },
        },
      },
});

async function main() {
  await mkdir(path.join(process.cwd(), env.uploadDir), { recursive: true });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  await app.register(cors, {
    origin(origin, cb) {
      // Same-origin and server-to-server calls arrive without an Origin header.
      if (!origin) return cb(null, true);
      if (env.corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  await app.register(cookie, { secret: env.cookieSecret, hook: "onRequest" });
  await app.register(jwt, {
    secret: env.jwtSecret,
    sign: { expiresIn: env.accessTokenTtl },
  });
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    errorResponseBuilder: () => ({ error: "Too many requests. Please slow down." }),
  });
  await app.register(multipart, {
    limits: { fileSize: env.maxUploadMb * 1024 * 1024, files: 1 },
  });

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), env.uploadDir),
    prefix: "/uploads/",
    decorateReply: false,
  });

  // Every mutating request must carry the admin header (CSRF defence).
  app.addHook("onRequest", requireCsrfHeaderForApi);

  app.get("/health", async () => ({
    ok: true,
    service: "venu-profile-api",
    env: env.nodeEnv,
    database: isDbReady() ? "connected" : "connecting",
    uptime: Math.round(process.uptime()),
  }));

  // Data routes need Mongo; answer clearly instead of hanging while it reconnects.
  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api/")) return;
    if (isDbReady()) return;
    return reply.code(503).send({ error: "Database is reconnecting, try again in a moment" });
  });

  await app.register(
    async (api) => {
      await api.register(authRoutes, { prefix: "/auth" });
      await api.register(contentRoutes);
      await api.register(projectRoutes);
      await api.register(messageRoutes);
      await api.register(notificationRoutes);
      await api.register(mediaRoutes);
    },
    { prefix: "/api" }
  );

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({ error: `Route ${request.method} ${request.url} not found` });
  });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) request.log.error(error);
    reply.code(status).send({ error: status >= 500 ? "Something went wrong" : error.message });
  });

  // Start listening immediately; the database attaches as soon as it is reachable.
  connectDbWithRetry({ info: (m) => app.log.info(m), warn: (m) => app.log.warn(m) });

  whenDbReady(async () => {
    await getOrCreateContent();
    if ((await Project.countDocuments()) === 0) {
      await Project.insertMany(defaultProjects);
      app.log.info(`Seeded ${defaultProjects.length} projects`);
    }
  });

  await app.listen({ port: env.port, host: env.host });
  app.log.info(`API ready on ${env.publicUrl}`);
}

/** Runs the callback once the database is available (now or on reconnect). */
function whenDbReady(fn: () => Promise<void>) {
  const run = () => void fn().catch((error) => app.log.error(error));
  if (isDbReady()) run();
  else mongoose.connection.once("connected", run);
}

/** Applies the CSRF header check to state-changing API routes only. */
async function requireCsrfHeaderForApi(request: any, reply: any) {
  if (!request.url.startsWith("/api/")) return;
  if (request.url.startsWith("/api/contact")) return; // public form, protected by rate limit + honeypot
  return requireCsrfHeader(request, reply);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    app.log.info(`${signal} received, shutting down`);
    await app.close();
    process.exit(0);
  });
}

main().catch((error) => {
  app.log.error(error);
  process.exit(1);
});

import mongoose from "mongoose";
import { env } from "./config/env.js";

mongoose.set("strictQuery", true);

let connecting: Promise<typeof mongoose> | null = null;

export function isDbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDb(): Promise<typeof mongoose> {
  if (isDbReady()) return mongoose;
  if (connecting) return connecting;

  connecting = mongoose
    .connect(env.mongoUri, {
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
    })
    .finally(() => {
      connecting = null;
    });

  return connecting;
}

/**
 * Keeps retrying in the background with backoff. Atlas occasionally refuses TLS
 * handshakes on shared tiers, and a flaky network should not take the API down -
 * routes that need data return 503 until the connection comes back.
 */
export function connectDbWithRetry(log: { info: (m: string) => void; warn: (m: string) => void }): void {
  let attempt = 0;

  const tryConnect = async () => {
    attempt += 1;
    try {
      await connectDb();
      attempt = 0;
      log.info("MongoDB connected");
    } catch (error) {
      const delay = Math.min(30000, 2000 * 2 ** Math.min(attempt - 1, 4));
      log.warn(
        `MongoDB connection failed (attempt ${attempt}): ${(error as Error).message.slice(0, 140)} - retrying in ${
          delay / 1000
        }s`
      );
      setTimeout(tryConnect, delay).unref?.();
    }
  };

  void tryConnect();

  mongoose.connection.on("disconnected", () => {
    log.warn("MongoDB disconnected - reconnecting");
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

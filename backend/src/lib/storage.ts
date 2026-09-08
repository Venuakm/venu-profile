import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { v2 as cloudinary } from "cloudinary";
import type { Readable } from "node:stream";
import { env } from "../config/env.js";

export type StoredFile = {
  url: string;
  filename: string;
  provider: "cloudinary" | "local";
  publicId?: string;
  bytes: number;
};

let configured = false;

export function isCloudinaryEnabled(): boolean {
  return Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);
}

function configure() {
  if (configured) return;
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  configured = true;
}

/**
 * Stores an uploaded file.
 *
 * Cloudinary is used whenever it is configured - most hosts have an ephemeral
 * filesystem, so local uploads would disappear on the next deploy. Without
 * credentials it falls back to the local uploads directory, which is fine for
 * development.
 */
export async function storeUpload(
  stream: Readable,
  options: { mimetype: string; extension: string; folder: string; originalName: string }
): Promise<StoredFile> {
  if (isCloudinaryEnabled()) {
    return uploadToCloudinary(stream, options);
  }
  return uploadToDisk(stream, options);
}

function uploadToCloudinary(
  stream: Readable,
  options: { mimetype: string; folder: string; originalName: string }
): Promise<StoredFile> {
  configure();

  // Cloudinary treats anything that is not an image or video as "raw" (PDFs here).
  const resourceType = options.mimetype.startsWith("image/") ? "image" : "raw";

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `${env.cloudinary.folder}/${options.folder}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve({
          url: result.secure_url,
          filename: result.public_id.split("/").pop() ?? result.public_id,
          provider: "cloudinary",
          publicId: result.public_id,
          bytes: result.bytes ?? 0,
        });
      }
    );

    stream.on("error", reject);
    stream.pipe(upload);
  });
}

async function uploadToDisk(
  stream: Readable & { truncated?: boolean; bytesRead?: number },
  options: { extension: string; folder: string }
): Promise<StoredFile> {
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${options.extension}`;
  const target = path.join(process.cwd(), env.uploadDir, filename);

  try {
    await pipeline(stream, createWriteStream(target));
  } catch (error) {
    await unlink(target).catch(() => {});
    throw error;
  }

  if (stream.truncated) {
    await unlink(target).catch(() => {});
    throw new Error(`Files must be under ${env.maxUploadMb}MB`);
  }

  return {
    url: `/uploads/${filename}`,
    filename,
    provider: "local",
    bytes: stream.bytesRead ?? 0,
  };
}

/** Removes a stored file from wherever it lives. */
export async function deleteStored(file: { provider?: string; publicId?: string | null; filename: string }) {
  if (file.provider === "cloudinary" && file.publicId) {
    configure();
    await cloudinary.uploader.destroy(file.publicId, { invalidate: true }).catch(() => undefined);
    return;
  }
  await unlink(path.join(process.cwd(), env.uploadDir, file.filename)).catch(() => undefined);
}

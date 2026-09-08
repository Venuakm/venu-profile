/**
 * Pushes selected fields from the shipped defaults into an existing database.
 * The seed script never overwrites live content, so this exists for the cases
 * where a default genuinely changed and should be adopted.
 *
 * Usage: npx tsx src/sync-content.ts hero.stats [more.paths...]
 */
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./db.js";
import { Content } from "./models/Content.js";
import { defaultContent } from "./lib/defaultContent.js";

const paths = process.argv.slice(2);
if (!paths.length) {
  console.error("Pass at least one dotted path, e.g. hero.stats");
  process.exit(1);
}

function read(source: any, path: string) {
  return path.split(".").reduce((node, key) => node?.[key], source);
}

function write(target: any, path: string, value: unknown) {
  const parts = path.split(".");
  let node = target;
  for (const key of parts.slice(0, -1)) {
    if (node[key] == null || typeof node[key] !== "object") node[key] = {};
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
}

await connectDb();
console.log(`Connected to ${env.mongoDbName}`);

const doc = await Content.findOne({ key: "main" });
if (!doc) {
  console.error("No content document found - run the seed first.");
  await disconnectDb();
  process.exit(1);
}

const data = { ...(doc.data as Record<string, unknown>) };
for (const path of paths) {
  const value = read(defaultContent, path);
  if (value === undefined) {
    console.warn(`Skipped ${path} - not present in the defaults`);
    continue;
  }
  write(data, path, value);
  console.log(`Updated ${path}`);
}

doc.data = data;
doc.markModified("data");
doc.version += 1;
await doc.save();

console.log(`Saved as version ${doc.version}`);
await disconnectDb();

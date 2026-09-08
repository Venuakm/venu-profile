/**
 * One-off helper: sets the owner account's username and password.
 * Usage: npx tsx src/set-credentials.ts <username> <password>
 */
import bcrypt from "bcryptjs";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./db.js";
import { Admin } from "./models/Admin.js";

const [username, password] = process.argv.slice(2);
if (!username || !password) {
  console.error("Usage: npx tsx src/set-credentials.ts <username> <password>");
  process.exit(1);
}

await connectDb();

const admin = await Admin.findOne({ email: env.adminEmail.toLowerCase() });
if (!admin) {
  console.error(`No admin found for ${env.adminEmail}. Run "npm run seed" first.`);
  await disconnectDb();
  process.exit(1);
}

admin.username = username.toLowerCase();
admin.passwordHash = await bcrypt.hash(password, 12);
admin.passwordChangedAt = new Date();
admin.failedAttempts = 0;
admin.lockedUntil = null;
await admin.save();

console.log(`Updated. Sign in with "${admin.username}" or "${admin.email}".`);
await disconnectDb();

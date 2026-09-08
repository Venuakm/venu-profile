import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./db.js";
import { Admin } from "./models/Admin.js";
import { Content } from "./models/Content.js";
import { Project } from "./models/Project.js";
import { defaultContent, defaultProjects } from "./lib/defaultContent.js";

/** Creates the owner account, site content and starter projects. Safe to re-run. */
async function seed() {
  await connectDb();
  console.log(`Connected to ${env.mongoDbName}`);

  let generatedPassword = "";
  const existingAdmin = await Admin.findOne({ email: env.adminEmail.toLowerCase() });

  if (existingAdmin) {
    console.log(`Admin already exists: ${existingAdmin.email}`);
  } else {
    const password = env.adminPassword || (generatedPassword = crypto.randomBytes(9).toString("base64url"));
    await Admin.create({
      email: env.adminEmail.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      name: env.adminName,
      role: "owner",
    });
    console.log(`Admin created: ${env.adminEmail}`);
    if (generatedPassword) {
      console.log(`Generated password: ${generatedPassword}`);
      console.log("Save it now - it is not stored anywhere in plain text.");
    }
  }

  const content = await Content.findOne({ key: "main" });
  if (content) {
    console.log("Site content already present - left untouched.");
  } else {
    await Content.create({ key: "main", data: defaultContent });
    console.log("Site content seeded.");
  }

  const projectCount = await Project.countDocuments();
  if (projectCount > 0) {
    console.log(`${projectCount} projects already present - left untouched.`);
  } else {
    await Project.insertMany(defaultProjects);
    console.log(`Seeded ${defaultProjects.length} projects.`);
  }

  await disconnectDb();
  console.log("Done.");
}

seed().catch(async (error) => {
  console.error("Seed failed:", error);
  await disconnectDb().catch(() => {});
  process.exit(1);
});

import { Schema, model, type InferSchemaType } from "mongoose";

const adminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["owner", "editor"], default: "owner" },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: "" },
    passwordChangedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export type AdminDoc = InferSchemaType<typeof adminSchema>;
export const Admin = model("Admin", adminSchema);

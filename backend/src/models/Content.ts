import { Schema, model } from "mongoose";

/**
 * The whole site copy lives in one document so the admin dashboard can edit any
 * field without a migration. `data` is intentionally schemaless.
 */
const contentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "main", index: true },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
    version: { type: Number, default: 1 },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true, minimize: false }
);

export const Content = model("Content", contentSchema);

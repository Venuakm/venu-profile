import { Schema, model } from "mongoose";

const mediaSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, default: "" },
    url: { type: String, required: true },
    mime: { type: String, default: "" },
    size: { type: Number, default: 0 },
    alt: { type: String, default: "" },
    folder: { type: String, default: "general", index: true },
  },
  { timestamps: true }
);

export const Media = model("Media", mediaSchema);

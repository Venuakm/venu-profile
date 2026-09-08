import { Schema, model } from "mongoose";

const notificationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["message", "auth", "content", "project", "system", "media"],
      default: "system",
      index: true,
    },
    level: { type: String, enum: ["info", "success", "warning", "critical"], default: "info" },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    href: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1 });

export const Notification = model("Notification", notificationSchema);

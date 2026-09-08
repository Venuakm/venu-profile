import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, default: "" },
    message: { type: String, required: true },
    budget: { type: String, default: "" },
    company: { type: String, default: "" },
    status: { type: String, enum: ["new", "read", "replied", "archived"], default: "new", index: true },
    starred: { type: Boolean, default: false },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    replies: {
      type: [
        new Schema(
          { body: String, sentAt: { type: Date, default: () => new Date() }, delivered: Boolean },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

export const Message = model("Message", messageSchema);

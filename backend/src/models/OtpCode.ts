import { Schema, model, Types } from "mongoose";

export const OTP_PURPOSES = ["login", "change-password", "change-username", "change-email"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

const otpCodeSchema = new Schema(
  {
    admin: { type: Types.ObjectId, ref: "Admin", required: true, index: true },
    purpose: { type: String, enum: OTP_PURPOSES, required: true, index: true },
    // Codes are stored hashed, so a database leak cannot be replayed.
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

// Expired codes clear themselves out.
otpCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpCode = model("OtpCode", otpCodeSchema);

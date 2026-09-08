import { Schema, model } from "mongoose";

const metricSchema = new Schema({ label: String, value: String }, { _id: false });

const projectSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    tagline: { type: String, default: "" },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },
    cover: { type: String, default: "/placeholders/project-cover.svg" },
    gallery: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    stack: { type: [String], default: [] },
    role: { type: String, default: "" },
    year: { type: String, default: "" },
    metrics: { type: [metricSchema], default: [] },
    links: {
      live: { type: String, default: "" },
      github: { type: String, default: "" },
      caseStudy: { type: String, default: "" },
    },
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    accent: { type: String, default: "" },
  },
  { timestamps: true }
);

projectSchema.index({ order: 1, createdAt: -1 });

export const Project = model("Project", projectSchema);

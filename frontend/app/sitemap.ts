import type { MetadataRoute } from "next";
import { fetchPublic } from "@/lib/api";
import { absoluteUrl } from "@/lib/site";
import type { Project } from "@/lib/types";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await fetchPublic<{ projects: Project[] }>("/api/projects", 3600);
  const projects = response?.projects ?? [];

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...projects.map((project) => ({
      url: absoluteUrl(`/work/${project.slug}`),
      lastModified: project.updatedAt ? new Date(project.updatedAt) : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

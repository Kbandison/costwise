import { MetadataRoute } from "next";
import stateColData from "@/public/data/state-col-data.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Static pages
  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
  ];

  // Dynamic state pages
  const stateRoutes = Object.keys(stateColData.states).map((code) => ({
    url: `${baseUrl}/state/${code.toLowerCase()}`,
    lastModified: new Date(stateColData.generatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [...routes, ...stateRoutes];
}

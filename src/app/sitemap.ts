import { MetadataRoute } from "next";
import { archiveData, atlasData } from "@/lib/data";
import { siteUrl } from "@/lib/path";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/archive`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  const archivePages: MetadataRoute.Sitemap = archiveData.map((item) => ({
    url: `${siteUrl}/archive/${item.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const atlasPages: MetadataRoute.Sitemap = [];
  atlasData.forEach((atlas) => {
    atlasPages.push({
      url: `${siteUrl}/atlas/${atlas.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    });
    if (atlas.subCollections) {
      atlas.subCollections.forEach((sub) => {
        atlasPages.push({
          url: `${siteUrl}/atlas/${atlas.id}/${sub.id}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.5,
        });
      });
    }
  });

  return [...staticPages, ...archivePages, ...atlasPages];
}

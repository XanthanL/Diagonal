import { MetadataRoute } from "next";
import { archiveData, atlasData } from "@/lib/data";
import { artistsData } from "@/lib/artists";
import { PROJECT_SLUGS } from "@/lib/projects";
import { siteUrl } from "@/lib/path";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/archive`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${siteUrl}/atlas`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/artists`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];

  const archivePages: MetadataRoute.Sitemap = archiveData.map((item) => ({
    url: `${siteUrl}/archive/${item.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const artistPages: MetadataRoute.Sitemap = artistsData.map((artist) => ({
    url: `${siteUrl}/artists/${artist.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const projectPages: MetadataRoute.Sitemap = PROJECT_SLUGS.map((slug) => ({
    url: `${siteUrl}/projects/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
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

  return [...staticPages, ...archivePages, ...artistPages, ...projectPages, ...atlasPages];
}

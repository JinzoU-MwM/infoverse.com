import type { MetadataRoute } from "next";
import { getSitemapEntitySlugs } from "@/lib/seo/sitemap-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "http://localhost:3000";
  const staticUrls = ["", "/about", "/contact", "/search", "/newsletter", "/media", "/premium-insights"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const { articleSlugs, categorySlugs, tagSlugs, authorSlugs } = await getSitemapEntitySlugs();

  const articleUrls = articleSlugs.map((slug) => ({
    url: `${base}/article/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryUrls = categorySlugs.map((slug) => ({
    url: `${base}/category/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  const tagUrls = tagSlugs.map((slug) => ({
    url: `${base}/tag/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const authorUrls = authorSlugs.map((slug) => ({
    url: `${base}/author/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticUrls, ...articleUrls, ...categoryUrls, ...tagUrls, ...authorUrls];
}

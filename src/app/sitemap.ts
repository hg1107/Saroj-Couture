import type { MetadataRoute } from "next";
import { getCategories } from "@/lib/queries/categories";
import { getAllPublishedGarments } from "@/lib/queries/garments";
import { SEO } from "@/lib/utils/constants";

// Dynamic sitemap — built from live, visible categories and published
// garments on every request. RLS (anon role) already excludes garments
// sitting in a hidden category, so this can never leak an unlisted page.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, garments] = await Promise.all([
    getCategories(),
    getAllPublishedGarments(),
  ]);

  const homeEntry: MetadataRoute.Sitemap[number] = {
    url: SEO.siteUrl,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
  };

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SEO.siteUrl}/category/${c.slug}`,
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const garmentEntries: MetadataRoute.Sitemap = garments.map((g) => ({
    url: `${SEO.siteUrl}/garment/${g.slug}`,
    lastModified: new Date(g.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [homeEntry, ...categoryEntries, ...garmentEntries];
}

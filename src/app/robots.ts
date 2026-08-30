import type { MetadataRoute } from "next";
import { SEO } from "@/lib/utils/constants";

// Static robots.txt — allows all crawlers, keeps the admin/auth/API surface
// out of the index, and points at the dynamic sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/auth/", "/api/"],
    },
    sitemap: `${SEO.siteUrl}/sitemap.xml`,
  };
}

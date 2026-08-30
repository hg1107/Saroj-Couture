import type { MetadataRoute } from "next";

// Phase 5: reviewed and confirmed — disallow admin + auth crawling.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/auth/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

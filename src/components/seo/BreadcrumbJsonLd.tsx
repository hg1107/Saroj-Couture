import { SEO } from "@/lib/utils/constants";
import type { BreadcrumbItem } from "@/components/Breadcrumbs";

interface Props {
  items: BreadcrumbItem[];
}

/** JSON-LD BreadcrumbList schema — pass the same items given to <Breadcrumbs>. */
export default function BreadcrumbJsonLd({ items }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SEO.siteUrl}${item.href}` } : {}),
    })),
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

import { BUSINESS, CONTACT, SEO, MAPS_URL } from "@/lib/utils/constants";

/**
 * JSON-LD LocalBusiness schema for the homepage.
 * Deliberately omits `streetAddress` — locality only, never a house/plot number.
 */
export default function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ClothingStore"],
    name: BUSINESS.name,
    description: SEO.defaultDescription,
    url: SEO.siteUrl,
    telephone: CONTACT.phone,
    areaServed: BUSINESS.city,
    priceRange: "₹₹",
    hasMap: MAPS_URL,
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.state,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country,
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "19:00",
    },
    sameAs: [CONTACT.instagram],
  };

  // Neutralize "</script>" so the embedded JSON can never break out of the tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

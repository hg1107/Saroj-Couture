import { BUSINESS, CONTACT, SEO } from "@/lib/utils/constants";

/**
 * JSON-LD LocalBusiness schema for the homepage.
 * Deliberately omits `streetAddress` — locality only, never a house/plot number.
 */
export default function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: BUSINESS.name,
    url: SEO.siteUrl,
    telephone: CONTACT.phone,
    areaServed: BUSINESS.city,
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.state,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country,
    },
    sameAs: [CONTACT.instagram],
  };

  // Neutralize "</script>" so the embedded JSON can never break out of the tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

import { BUSINESS, CONTACT, SEO } from "@/lib/utils/constants";

/**
 * JSON-LD Organization schema — site-wide brand entity (rendered once, in the
 * root layout). Separate from <LocalBusinessJsonLd>, which describes the
 * physical storefront and only renders on the homepage.
 */
export default function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BUSINESS.name,
    alternateName: "Saroj Couture Nagpur",
    url: SEO.siteUrl,
    logo: `${SEO.siteUrl}/apple-icon`,
    sameAs: [CONTACT.instagram],
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

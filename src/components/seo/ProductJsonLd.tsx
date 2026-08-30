import { SEO } from "@/lib/utils/constants";

interface Props {
  title: string;
  description: string | null;
  price: number | null;
  priceType: string;
  images: string[]; // full-size URLs, cover image first
  slug: string;
}

/** JSON-LD Product schema for a garment detail page. */
export default function ProductJsonLd({ title, description, price, priceType, images, slug }: Props) {
  const url = `${SEO.siteUrl}/garment/${slug}`;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    image: images,
    description: description ?? `${title} — bespoke custom-stitched garment from Saroj Couture, Nagpur.`,
    url,
  };

  // Omitted entirely for "on enquiry" pieces — there's no price to publish.
  if (priceType !== "on_enquiry" && price !== null) {
    data.offers = {
      "@type": "Offer",
      price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

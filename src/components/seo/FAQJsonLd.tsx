export interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
}

/** JSON-LD FAQPage schema — pass the same Q&A copy rendered on the page. */
export default function FAQJsonLd({ items }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

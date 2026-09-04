import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/queries/categories";
import { BUSINESS, SEO } from "@/lib/utils/constants";
import { buildWhatsAppMessageLink } from "@/lib/utils/whatsapp";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFab from "@/components/WhatsAppFab";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import FAQJsonLd, { type FAQItem } from "@/components/seo/FAQJsonLd";

const ABOUT_BREADCRUMBS = [{ label: "Home", href: "/" }, { label: "About" }];

const TITLE = "About Us — Designer Boutique & Custom Stitching Atelier, Nagpur";
const DESCRIPTION =
  "Saroj Couture is a designer boutique and custom-stitching atelier in Teka Naka, Kamptee Road, Nagpur — bespoke sarees, bridal lehengas, kurtis, gowns and ghagra choli, made to measure.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SEO.siteUrl}/about` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SEO.siteUrl}/about`,
  },
};

const FAQS: FAQItem[] = [
  {
    question: `Where is ${BUSINESS.name} located in Nagpur?`,
    answer: `Our atelier is in ${BUSINESS.locality}, ${BUSINESS.city}, ${BUSINESS.state}. See the Contact page for the map and directions.`,
  },
  {
    question: "What kind of custom stitching do you offer?",
    answer:
      "We design and stitch women's designer wear to individual measurements — sarees and saree blouses, bridal and party lehengas, ghagra choli, kurtis, and gowns.",
  },
  {
    question: "Do you make bridal lehengas in Nagpur?",
    answer:
      "Yes — bridal and occasion lehengas are one of our specialities, custom-fitted and finished with embroidery and embellishment to your design brief.",
  },
  {
    question: "How do I book a consultation or place an order?",
    answer:
      "Message us on WhatsApp with what you're looking for, or visit the boutique in person during opening hours. See the Contact page for the direct link and phone number.",
  },
  {
    question: `What are ${BUSINESS.name}'s boutique hours?`,
    answer: "Monday to Saturday, 10:00 AM – 7:00 PM.",
  },
];

export default async function AboutPage() {
  const categories = await getCategories();

  return (
    <>
      <BreadcrumbJsonLd items={ABOUT_BREADCRUMBS} />
      <FAQJsonLd items={FAQS} />
      <SiteHeader categories={categories} />

      <main className="w-full max-w-[860px] mx-auto px-margin-mobile md:px-margin-desktop pb-20 md:pb-section-gap pt-[4.5rem] flex flex-col gap-14">
        <div className="pt-6">
          <Breadcrumbs items={ABOUT_BREADCRUMBS} />
        </div>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center max-w-xl mx-auto pt-4">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest font-medium mb-2">
            About the Atelier
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal mb-3">
            A Designer Boutique &amp; Custom-Stitching Atelier in Nagpur
          </h1>
          <div className="w-16 h-px bg-outline-variant mb-4" aria-hidden="true" />
          <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed">
            {BUSINESS.name} is a boutique in {BUSINESS.locality}, {BUSINESS.city}, designing and
            stitching women&apos;s garments to each customer&apos;s exact measurements — rather than
            selling ready-made pieces off a rack.
          </p>
        </div>

        {/* ── What We Craft ─────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-primary font-normal border-b border-outline-variant pb-3">
            What We Craft
          </h2>
          <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed">
            As a design tailor and boutique, our work spans bridal and occasion lehengas, saree
            blouse stitching, ghagra choli, kurtis, and gowns — every piece custom-fitted and
            finished to your chosen fabric, silhouette, and embroidery detail.
          </p>
          {categories.length > 0 && (
            <ul className="flex flex-wrap gap-3" aria-label="Garment categories we stitch">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="inline-flex items-center px-4 py-2 rounded-xs border border-outline-variant text-sm font-label-md text-primary hover:border-secondary hover:text-secondary transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── How Custom Stitching Works ────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-primary font-normal border-b border-outline-variant pb-3">
            How Custom Stitching Works
          </h2>
          <ol className="flex flex-col gap-4 font-sans text-sm md:text-base text-on-surface-variant leading-relaxed list-none">
            <li className="flex gap-3">
              <span className="font-serif text-secondary shrink-0">01</span>
              <span><strong className="text-primary font-medium">Consultation</strong> — tell us about the occasion, fabric, and look you have in mind, over WhatsApp or in person.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-secondary shrink-0">02</span>
              <span><strong className="text-primary font-medium">Measurements &amp; Design</strong> — we take precise measurements and finalise the design, embroidery, and embellishment.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-secondary shrink-0">03</span>
              <span><strong className="text-primary font-medium">Stitching &amp; Fitting</strong> — your garment is cut and stitched at the atelier, with fittings along the way.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif text-secondary shrink-0">04</span>
              <span><strong className="text-primary font-medium">Delivery</strong> — collect your finished, made-to-measure piece from the Nagpur studio.</span>
            </li>
          </ol>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-primary font-normal border-b border-outline-variant pb-3">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col divide-y divide-outline-variant">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex items-center justify-between gap-4 cursor-pointer font-label-lg text-sm text-primary font-medium marker:content-none [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span className="material-symbols-outlined text-secondary text-xl shrink-0 transition-transform group-open:rotate-45" aria-hidden="true">
                    add
                  </span>
                </summary>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed mt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="bg-surface-container-low border border-outline-variant rounded-sm p-8 flex flex-col items-center text-center gap-4">
          <h2 className="font-serif text-2xl text-primary font-normal">
            Start Your Custom Order
          </h2>
          <p className="font-sans text-sm text-on-surface-variant max-w-md">
            Reach out on WhatsApp or visit our {BUSINESS.locality} studio to begin your bespoke piece.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={buildWhatsAppMessageLink("Hi Saroj Couture, I'd like to know more about your work.")}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary text-on-secondary px-6 py-3 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium"
            >
              WhatsApp Us
            </a>
            <Link
              href="/contact"
              className="border border-outline-variant text-primary px-6 py-3 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:bg-surface-container transition-colors font-medium"
            >
              Contact &amp; Map
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

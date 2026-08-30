import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getGarmentBySlug, getGarmentsByCategory, formatPrice } from "@/lib/queries/garments";
import { getCategories } from "@/lib/queries/categories";
import { defaultImageAlt } from "@/lib/utils/format";
import { SEO } from "@/lib/utils/constants";
import SiteHeader from "@/components/SiteHeader";
import GarmentImageCarousel from "@/components/GarmentImageCarousel";
import WhatsAppFab from "@/components/WhatsAppFab";
import ProductJsonLd from "@/components/seo/ProductJsonLd";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const garment = await getGarmentBySlug(slug);
  if (!garment) return {};

  const categoryName = garment.categories?.name;
  const title = categoryName
    ? `${garment.title} — ${categoryName} | Saroj Couture`
    : `${garment.title} | Saroj Couture`;
  const description = garment.description ?? `${garment.title} — bespoke custom-stitched garment from Saroj Couture, Nagpur.`;
  const cover = garment.images.find((i) => i.display_order === 0) ?? garment.images[0];

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `${SEO.siteUrl}/garment/${slug}`,
      images: cover ? [{ url: cover.url }] : undefined,
    },
  };
}

export default async function GarmentDetailPage({ params }: Props) {
  const { slug } = await params;

  const [garment, categories] = await Promise.all([
    getGarmentBySlug(slug),
    getCategories(),
  ]);

  if (!garment) notFound();

  const categorySlug  = garment.categories?.slug ?? "";
  const relatedRaw    = categorySlug ? await getGarmentsByCategory(categorySlug) : [];
  const related       = relatedRaw.filter((g) => g.slug !== slug).slice(0, 6);

  const whatsappMsg = `Hi, I'm interested in the "${garment.title}" from Saroj Couture. Can you share more details?`;

  return (
    <>
      <ProductJsonLd
        title={garment.title}
        description={garment.description}
        price={garment.price}
        priceType={garment.price_type}
        images={garment.images.map((img) => img.url)}
        slug={garment.slug}
      />
      <SiteHeader categories={categories} />

      <main className="flex-grow pt-20 pb-24 px-margin-mobile md:px-margin-desktop max-w-5xl mx-auto w-full flex flex-col gap-10">
        {/* ── Back navigation ───────────────────────────────────────────── */}
        <div className="flex items-center gap-2 pt-2">
          <Link
            href={categorySlug ? `/category/${categorySlug}` : "/"}
            aria-label="Go back"
            className="p-2 hover:opacity-80 transition-opacity active:scale-95 duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
          >
            <span className="material-symbols-outlined text-primary" aria-hidden="true">arrow_back</span>
          </Link>
          {garment.categories && (
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
              {garment.categories.name}
            </span>
          )}
        </div>

        {/* ── Product Display (2 columns on tablet/desktop, stacked on mobile) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="w-full flex justify-center">
            <GarmentImageCarousel
              images={garment.images}
              garmentTitle={garment.title}
              categoryName={garment.categories?.name}
            />
          </div>

          {/* Right Column: Details & Actions */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-serif">
                {garment.title}
              </h1>
              <p className="font-body-lg text-body-lg text-secondary font-medium">
                {formatPrice(garment.price, garment.price_type)}
              </p>
              {garment.description && (
                <p className="font-body-md text-body-md text-on-surface-variant mt-2 leading-relaxed whitespace-pre-line">
                  {garment.description}
                </p>
              )}
            </div>

            {/* Detail Table */}
            <section
              aria-label="Garment details"
              className="flex flex-col border-t border-b border-outline-variant py-4 my-2"
            >
              {garment.fabric && (
                <div className="flex justify-between py-2.5 border-b border-outline-variant">
                  <span className="font-label-lg text-label-lg text-on-surface-variant">Fabric</span>
                  <span className="font-body-md text-body-md text-primary font-medium">{garment.fabric}</span>
                </div>
              )}
              {garment.categories && (
                <div className="flex justify-between py-2.5">
                  <span className="font-label-lg text-label-lg text-on-surface-variant">Category</span>
                  <span className="font-body-md text-body-md text-primary font-medium">{garment.categories.name}</span>
                </div>
              )}
            </section>

            {/* CTA — WhatsApp Enquiry */}
            <section className="flex flex-col gap-3">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""}?text=${encodeURIComponent(whatsappMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-secondary text-on-secondary font-label-lg text-label-lg uppercase tracking-widest py-4 rounded-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary shadow-xs"
              >
                <span>Enquire on WhatsApp</span>
                <span className="material-symbols-outlined text-xl" aria-hidden="true">chat</span>
              </a>
            </section>

            {/* Contact Links */}
            <section className="flex justify-start gap-8 py-2">
              {process.env.NEXT_PUBLIC_PHONE_NUMBER && (
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
                  className="font-label-md text-label-md text-primary hover:text-secondary uppercase tracking-widest border-b border-transparent hover:border-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  Call
                </a>
              )}
              {process.env.NEXT_PUBLIC_EMAIL && (
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}
                  className="font-label-md text-label-md text-primary hover:text-secondary uppercase tracking-widest border-b border-transparent hover:border-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  Email
                </a>
              )}
              {process.env.NEXT_PUBLIC_INSTAGRAM_URL && (
                <a
                  href={process.env.NEXT_PUBLIC_INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-label-md text-label-md text-primary hover:text-secondary uppercase tracking-widest border-b border-transparent hover:border-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                >
                  Instagram
                </a>
              )}
            </section>
          </div>
        </div>

        {/* ── Related Garments ──────────────────────────────────── */}
        {related.length > 0 && (
          <section className="flex flex-col gap-4 pt-8 border-t border-outline-variant">
            <h2 className="font-headline-md text-headline-md text-primary text-center">
              More from this category
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-margin-mobile px-margin-mobile">
              {related.map((g) => {
                const img = g.images.find((i) => i.display_order === 0) ?? g.images[0];
                return (
                  <Link
                    key={g.id}
                    href={`/garment/${g.slug}`}
                    className="min-w-[160px] aspect-[3/4] border border-outline-variant rounded-sm overflow-hidden bg-surface-container-lowest flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                    aria-label={g.title}
                  >
                    {img ? (
                      <Image
                        src={img.url}
                        alt={img.alt_text ?? defaultImageAlt(g.title, g.categories?.name)}
                        width={160}
                        height={213}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline" aria-hidden="true">image</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <WhatsAppFab message={whatsappMsg} label={`Enquire about ${garment.title} on WhatsApp`} />
    </>
  );
}

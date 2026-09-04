import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/queries/categories";
import { getAllPublishedGarmentsWithImages, formatPrice } from "@/lib/queries/garments";
import { defaultImageAlt } from "@/lib/utils/format";
import { SEO } from "@/lib/utils/constants";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFab from "@/components/WhatsAppFab";
import Breadcrumbs from "@/components/Breadcrumbs";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

const GALLERY_BREADCRUMBS = [{ label: "Home", href: "/" }, { label: "Gallery" }];

export const metadata: Metadata = {
  title: "Gallery & Collections — Saroj Couture | Nagpur",
  description: "Browse the full collection of bespoke designer wear, bridal lehengas, silk sarees, and custom outfits at Saroj Couture, Nagpur.",
  alternates: { canonical: `${SEO.siteUrl}/gallery` },
  openGraph: {
    title: "Gallery & Collections — Saroj Couture | Nagpur",
    description: "Browse the full collection of bespoke designer wear, bridal lehengas, silk sarees, and custom outfits at Saroj Couture, Nagpur.",
    url: `${SEO.siteUrl}/gallery`,
  },
};

export default async function GalleryPage() {
  const [categories, garments] = await Promise.all([
    getCategories(),
    getAllPublishedGarmentsWithImages(),
  ]);

  return (
    <>
      <BreadcrumbJsonLd items={GALLERY_BREADCRUMBS} />
      <SiteHeader categories={categories} />

      <main className="w-full max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop pb-20 md:pb-section-gap pt-[4.5rem] flex flex-col gap-10">
        <div className="pt-6">
          <Breadcrumbs items={GALLERY_BREADCRUMBS} />
        </div>

        {/* ── Gallery Header ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center max-w-xl mx-auto pt-4">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest font-medium mb-2">
            Bespoke Portfolio
          </span>
          <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal mb-3">
            Atelier Gallery
          </h1>
          <div className="w-16 h-px bg-outline-variant mb-4" aria-hidden="true" />
          <p className="font-sans text-sm md:text-base text-on-surface-variant leading-relaxed">
            Explore our curated catalog of custom-stitched sarees, gowns, kurtis, and designer couture created in Nagpur.
          </p>
        </div>

        {/* ── Category Filter Tabs ───────────────────────────────────────── */}
        {categories.length > 0 && (
          <nav
            aria-label="Filter categories"
            className="flex overflow-x-auto gap-4 md:gap-6 pb-2 no-scrollbar border-b border-outline-variant justify-start md:justify-center"
          >
            <Link
              href="/gallery"
              aria-current="page"
              className="font-label-lg text-label-lg whitespace-nowrap pb-2 border-b-2 uppercase tracking-widest transition-colors text-secondary border-secondary font-bold"
            >
              All Creations ({garments.length})
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="font-label-lg text-label-lg whitespace-nowrap pb-2 border-b-2 border-transparent uppercase tracking-widest transition-colors text-on-surface-variant hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}

        {/* ── Product Grid ───────────────────────────────────────────────── */}
        {garments.length === 0 ? (
          <div className="text-center py-20 bg-surface-container rounded-sm border border-outline-variant p-8 max-w-lg mx-auto">
            <span className="material-symbols-outlined text-outline text-5xl mb-3">checkroom</span>
            <p className="text-primary font-serif text-xl mb-1">Portfolio in preparation</p>
            <p className="text-on-surface-variant font-sans text-sm">
              Our newest pieces are currently being catalogued. Reach out on WhatsApp for personalized designs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {garments.map((garment) => {
              const coverImg = garment.images.find((i) => i.display_order === 0)
                ?? garment.images[0];
              return (
                <Link
                  key={garment.id}
                  href={`/garment/${garment.slug}`}
                  className="flex flex-col group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded max-w-[280px] w-full"
                >
                  <div className="w-full aspect-[3/4] bg-surface-container-high rounded-sm border border-outline-variant overflow-hidden mb-3 p-1 group-hover:border-secondary transition-colors">
                    {coverImg ? (
                      <Image
                        src={coverImg.url}
                        alt={coverImg.alt_text ?? defaultImageAlt(garment.title, garment.categories?.name)}
                        width={280}
                        height={373}
                        sizes="(max-width: 639px) 45vw, (max-width: 767px) 30vw, 280px"
                        className="w-full h-full object-cover rounded-xs transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-highest flex flex-col items-center justify-center gap-2 rounded-xs p-4">
                        <span className="material-symbols-outlined text-outline text-3xl" aria-hidden="true">image</span>
                        <span className="font-label-md text-[11px] text-outline uppercase tracking-wider text-center">Bespoke Piece</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-md text-[11px] text-secondary uppercase tracking-widest font-medium">
                      {garment.categories?.name ?? "Couture"}
                    </span>
                    <h3 className="font-serif text-base md:text-lg text-primary group-hover:text-secondary uppercase tracking-wider transition-colors line-clamp-1">
                      {garment.title}
                    </h3>
                    <p className="font-sans text-sm text-outline font-medium">
                      {formatPrice(garment.price, garment.price_type)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

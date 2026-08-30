import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories, getCategoryBySlug } from "@/lib/queries/categories";
import { getGarmentsByCategory, formatPrice } from "@/lib/queries/garments";
import { defaultImageAlt } from "@/lib/utils/format";
import { SEO } from "@/lib/utils/constants";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFab from "@/components/WhatsAppFab";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const title = `${category.name} — Saroj Couture, Nagpur`;
  const description = `Browse our ${category.name} collection — bespoke, custom-stitched designer wear from Saroj Couture, Nagpur.`;

  // Only fetch garments for the fallback OG image when the category has no cover of its own.
  let ogImage = category.cover_image_url ?? undefined;
  if (!ogImage) {
    const garments = await getGarmentsByCategory(slug);
    const cover = garments[0]?.images.find((i) => i.display_order === 0) ?? garments[0]?.images[0];
    ogImage = cover?.url;
  }

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      url: `${SEO.siteUrl}/category/${slug}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const [category, allCategories, garments] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getGarmentsByCategory(slug),
  ]);

  if (!category) notFound();

  return (
    <>
      <SiteHeader categories={allCategories} />

      <main className="w-full max-w-[1280px] mx-auto px-margin-mobile pb-section-gap pt-8 mt-16">
        {/* ── Category Header ────────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-3xl font-medium tracking-wide text-primary font-serif mb-2">
            {category.name}
          </h1>
          <div className="w-16 h-px bg-outline-variant mb-3" aria-hidden="true" />
          <p className="font-label-md text-label-md text-outline">
            {garments.length} {garments.length === 1 ? "piece" : "pieces"}
          </p>
        </div>

        {/* ── Category Filter Tabs ───────────────────────────────────────── */}
        <nav
          aria-label="Browse categories"
          className="flex overflow-x-auto gap-6 mb-10 pb-2 no-scrollbar border-b border-outline-variant"
        >
          {allCategories.map((cat) => {
            const active = cat.slug === slug;
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                aria-current={active ? "page" : undefined}
                className={`font-label-lg text-label-lg whitespace-nowrap pb-1 border-b-2 uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  active
                    ? "text-secondary border-secondary"
                    : "text-on-surface-variant border-transparent hover:text-on-surface"
                }`}
              >
                {cat.name}
              </Link>
            );
          })}
        </nav>

        {/* ── Product Grid ───────────────────────────────────────────────── */}
        {garments.length === 0 ? (
          <p className="text-center text-on-surface-variant font-body-md text-body-md py-16">
            No pieces in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10">
            {garments.map((garment) => {
              const coverImg = garment.images.find((i) => i.display_order === 0)
                ?? garment.images[0];
              return (
                <Link
                  key={garment.id}
                  href={`/garment/${garment.slug}`}
                  className="flex flex-col group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                >
                  <div className="w-full aspect-[3/4] bg-surface-container-high rounded border border-outline-variant overflow-hidden mb-3 p-1">
                    {coverImg ? (
                      <Image
                        src={coverImg.url}
                        alt={coverImg.alt_text ?? defaultImageAlt(garment.title, category.name)}
                        width={200}
                        height={267}
                        className="w-full h-full object-cover rounded-sm transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-highest flex items-center justify-center rounded-sm">
                        <span className="material-symbols-outlined text-outline" aria-hidden="true">image</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-1">
                    {garment.title}
                  </h3>
                  <p className="font-label-md text-label-md text-outline">
                    {formatPrice(garment.price, garment.price_type)}
                  </p>
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

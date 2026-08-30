import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/queries/categories";
import { getFeaturedGarments, formatPrice } from "@/lib/queries/garments";
import { defaultImageAlt } from "@/lib/utils/format";
import { SEO } from "@/lib/utils/constants";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFab from "@/components/WhatsAppFab";
import LocalBusinessJsonLd from "@/components/seo/LocalBusinessJsonLd";

const TITLE = "Saroj Couture — Designer Boutique in Nagpur | Teka Naka, Kamptee Road";
const DESCRIPTION =
  "Saroj Couture — bespoke women's designer wear and custom stitching in Teka Naka, Kamptee Road, Nagpur. Sarees, ghagra choli, kurtis, gowns and more.";

export async function generateMetadata(): Promise<Metadata> {
  const featured = await getFeaturedGarments();
  const hero = featured[0];
  const heroImage = hero?.images.find((img) => img.display_order === 0) ?? hero?.images[0];

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: SEO.siteUrl,
      images: heroImage ? [{ url: heroImage.url }] : undefined,
    },
  };
}

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedGarments(),
  ]);

  const heroGarment = featured[0];
  const heroImage   = heroGarment?.images.find((img) => img.display_order === 0) ?? heroGarment?.images[0];

  return (
    <>
      <LocalBusinessJsonLd />
      <SiteHeader categories={categories} />

      <main className="pt-16 pb-20">
        {/* ── Hero Section ─────────────────────────────────────────────── */}
        <section
          aria-label="Hero"
          className="relative w-full aspect-[4/5] bg-surface-container flex flex-col justify-end p-margin-mobile mb-20"
        >
          {/* Scrim overlay */}
          <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" aria-hidden="true" />

          {/* Hero image */}
          {heroImage ? (
            <Image
              src={heroImage.url}
              alt={heroImage.alt_text ?? defaultImageAlt(heroGarment!.title, heroGarment!.categories?.name)}
              fill
              className="absolute inset-0 object-cover z-0"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-surface-container-high z-0" />
          )}

          {/* Hero copy */}
          <div className="relative z-20 w-[85%]">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary mb-6 drop-shadow-md">
              Custom-stitched,<br />made to your measure.
            </h1>
            <Link
              href="/category/ghagra-choli"
              className="bg-secondary text-on-secondary px-6 py-4 rounded font-label-lg text-label-lg uppercase tracking-widest inline-flex items-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
            >
              View our work
              <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* ── Category Strip ────────────────────────────────────────────── */}
        {categories.length > 0 && (
          <section
            aria-label="Browse categories"
            className="mb-20 pl-margin-mobile overflow-hidden"
          >
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-margin-mobile">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="flex-none w-32 flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                >
                  <div className="w-full aspect-[3/4] bg-surface-container rounded-sm border border-outline-variant overflow-hidden">
                    {cat.cover_image_url ? (
                      <Image
                        src={cat.cover_image_url}
                        alt={cat.name}
                        width={128}
                        height={171}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline" aria-hidden="true">checkroom</span>
                      </div>
                    )}
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant uppercase text-center w-full block">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Garments ─────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section
            aria-label="Featured garments"
            className="px-margin-mobile mb-20"
          >
            <h2 className="font-headline-md text-headline-md text-primary mb-8 uppercase tracking-wider">
              Featured
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-10">
              {featured.map((garment) => {
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
                          alt={coverImg.alt_text ?? defaultImageAlt(garment.title, garment.categories?.name)}
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
          </section>
        )}
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

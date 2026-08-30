import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/queries/categories";
import { getFeaturedGarments, formatPrice } from "@/lib/queries/garments";
import { defaultImageAlt } from "@/lib/utils/format";
import { SEO, CONTACT, BUSINESS } from "@/lib/utils/constants";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppFab from "@/components/WhatsAppFab";
import LocalBusinessJsonLd from "@/components/seo/LocalBusinessJsonLd";

const TITLE = "Saroj Couture — Designer Boutique in Nagpur | Teka Naka, Kamptee Road";
const DESCRIPTION =
  "Saroj Couture — bespoke women's designer wear and custom stitching in Teka Naka, Kamptee Road, Nagpur. Sarees, ghagra choli, kurtis, gowns and more.";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: SEO.siteUrl,
    },
  };
}

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedGarments(),
  ]);

  const whatsappConsultUrl = `https://wa.me/${CONTACT.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi Saroj Couture, I'm interested in custom stitching / bespoke design consultation.")}`;

  return (
    <>
      <LocalBusinessJsonLd />
      <SiteHeader categories={categories} />

      <main className="pt-20 pb-20 max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop w-full flex flex-col gap-16">
        {/* ── Editorial Atelier Hero Section ──────────────────────────── */}
        <section
          aria-label="Hero"
          className="relative w-full rounded-sm overflow-hidden bg-gradient-to-br from-[#1b1713] via-[#15120f] to-[#0d0c0a] text-[#fcf9f4] border border-[#383027] p-8 md:p-16 flex flex-col justify-center items-center text-center"
        >
          {/* Subtle gold accent frame */}
          <div className="absolute inset-3 md:inset-4 border border-[#524436]/40 pointer-events-none rounded-xs" aria-hidden="true" />

          <div className="relative z-10 max-w-2xl flex flex-col items-center gap-5 my-4">
            {/* Atelier Crest / Tagline */}
            <div className="flex items-center gap-3 text-secondary-container font-label-md text-xs tracking-[0.25em] uppercase">
              <span className="w-6 md:w-10 h-px bg-secondary-container/80" />
              <span>Haute Atelier • Nagpur</span>
              <span className="w-6 md:w-10 h-px bg-secondary-container/80" />
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#fcf9f4] font-normal leading-[1.15] tracking-wide">
              Bespoke Elegance,<br />
              <span className="italic font-light text-[#e8d5c4]">Made to Your Measure.</span>
            </h1>

            {/* Description */}
            <p className="font-sans text-sm md:text-base text-[#cfc5ba] max-w-lg leading-relaxed font-light">
              Exquisite custom-stitched sarees, bridal lehengas, and designer couture tailored to your exact measurements and aesthetic at our Nagpur atelier.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              <Link
                href="/gallery"
                className="bg-secondary text-on-secondary px-8 py-3.5 rounded-xs font-label-lg text-xs uppercase tracking-[0.15em] inline-flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md font-medium"
              >
                <span>Explore Gallery</span>
                <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span>
              </Link>
              <a
                href={whatsappConsultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#7d6954] text-[#fcf9f4] hover:bg-white/5 px-7 py-3.5 rounded-xs font-label-lg text-xs uppercase tracking-[0.15em] inline-flex items-center gap-2 transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-base" aria-hidden="true">chat</span>
                <span>WhatsApp Consultation</span>
              </a>
            </div>

            {/* Trust highlights */}
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 pt-6 mt-4 border-t border-white/10 text-xs text-[#a89d90] font-sans">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-sm">straighten</span>
                Custom Silhouette Fitting
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-sm">diamond</span>
                Artisanal Zari &amp; Embroidery
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-sm">location_on</span>
                Teka Naka, Kamptee Road
              </span>
            </div>
          </div>
        </section>

        {/* ── Categories Section ────────────────────────────────────────── */}
        {categories.length > 0 && (
          <section id="categories" aria-label="Browse categories" className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal">
                  Our Collections
                </h2>
                <p className="font-sans text-sm text-on-surface-variant mt-1">
                  Explore bespoke styles and boutique categories
                </p>
              </div>
              <Link
                href="/gallery"
                className="font-label-md text-xs uppercase tracking-widest text-secondary hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group flex flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                >
                  <div className="w-full aspect-[3/4] bg-surface-container rounded-sm border border-outline-variant overflow-hidden flex flex-col items-center justify-center p-3 group-hover:border-secondary transition-colors">
                    {cat.cover_image_url ? (
                      <Image
                        src={cat.cover_image_url}
                        alt={cat.name}
                        width={200}
                        height={267}
                        className="w-full h-full object-cover rounded-xs transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex flex-col items-center justify-center gap-2 text-center rounded-xs">
                        <span className="material-symbols-outlined text-outline text-3xl" aria-hidden="true">checkroom</span>
                        <span className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider px-1">
                          {cat.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="font-label-md text-label-md text-primary group-hover:text-secondary uppercase text-center font-medium transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Featured Garments Section ─────────────────────────────────── */}
        {featured.length > 0 && (
          <section id="featured" aria-label="Featured garments" className="flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal">
                  Featured Creations
                </h2>
                <p className="font-sans text-sm text-on-surface-variant mt-1">
                  Selected bespoke garments handcrafted at our atelier
                </p>
              </div>
              <Link
                href="/gallery"
                className="font-label-md text-xs uppercase tracking-widest text-secondary hover:underline inline-flex items-center gap-1"
              >
                <span>Full Portfolio</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {featured.map((garment) => {
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
                      <h3 className="font-serif text-base md:text-lg text-primary group-hover:text-secondary transition-colors line-clamp-1">
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
          </section>
        )}

        {/* ── Contact Section on Homepage ───────────────────────────────── */}
        <section id="contact" aria-label="Contact and studio info" className="bg-surface-container-low border border-outline-variant rounded-sm p-8 md:p-12 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div className="max-w-lg flex flex-col gap-2">
            <span className="font-label-md text-xs uppercase tracking-widest text-secondary font-medium">
              Nagpur Studio
            </span>
            <h2 className="font-serif text-2xl md:text-3xl text-primary font-normal">
              Book a Bespoke Consultation
            </h2>
            <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
              Visit our boutique in {BUSINESS.locality}, {BUSINESS.city} or speak directly with our master tailors on WhatsApp to start your custom order.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <Link
              href="/contact"
              className="bg-secondary text-on-secondary px-6 py-3.5 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium"
            >
              Contact Details &amp; Map
            </Link>
            <a
              href={whatsappConsultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-6 py-3.5 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:opacity-90 transition-opacity inline-flex items-center gap-2 font-medium"
            >
              <span>WhatsApp Us</span>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}

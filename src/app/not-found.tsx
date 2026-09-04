import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/queries/categories";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const categories = await getCategories().catch(() => []);

  return (
    <>
      <SiteHeader categories={categories} />

      <main className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-margin-mobile pt-[4.5rem] pb-20 md:pb-section-gap">
        <span className="font-label-md text-xs text-secondary uppercase tracking-widest font-medium">
          Error 404
        </span>
        <h1 className="font-serif text-4xl md:text-5xl text-primary">
          This page doesn&apos;t exist
        </h1>
        <p className="font-sans text-sm md:text-base text-on-surface-variant max-w-md">
          The page you&apos;re looking for may have been moved or is no longer available.
          Explore our collections or get in touch below.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <Link
            href="/"
            className="bg-secondary text-on-secondary px-6 py-3 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium"
          >
            Return Home
          </Link>
          <Link
            href="/gallery"
            className="border border-outline-variant text-primary px-6 py-3 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:bg-surface-container transition-colors font-medium"
          >
            Browse Gallery
          </Link>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

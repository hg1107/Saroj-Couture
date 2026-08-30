/**
 * SiteHeader — fixed top app bar shared across all public pages.
 * Server Component: renders static markup, passes categories to NavDrawer.
 */
import Link from "next/link";
import type { Category } from "@/lib/supabase/types";
import NavDrawer from "./NavDrawer";

interface SiteHeaderProps {
  categories: Category[];
}

export default function SiteHeader({ categories }: SiteHeaderProps) {
  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-16 bg-background border-b border-outline-variant">
        {/* Brand — centred */}
        <Link
          href="/"
          className="font-headline-md text-headline-md text-primary tracking-widest uppercase absolute left-1/2 -translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          SAROJ COUTURE
        </Link>

        {/* Left side — spacer */}
        <div className="w-10" aria-hidden />

        {/* Right side — menu trigger (rendered by NavDrawer client component) */}
        <NavDrawer categories={categories} />
      </header>
    </>
  );
}

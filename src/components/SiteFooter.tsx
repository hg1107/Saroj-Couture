/** SiteFooter — shared across all public pages. Server Component. */
export default function SiteFooter() {
  return (
    <footer className="w-full px-margin-mobile py-section-gap flex flex-col gap-gutter bg-surface-container border-t border-outline-variant mt-auto">
      <h2 className="font-headline-md text-headline-md uppercase tracking-tighter text-on-surface">
        SAROJ COUTURE
      </h2>
      <nav className="flex flex-col gap-4" aria-label="Footer navigation">
        <a
          className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors uppercase"
          href="/#address"
        >
          Address
        </a>
        <a
          className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors uppercase"
          href="/#hours"
        >
          Hours
        </a>
        <a
          className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors uppercase"
          href="/terms"
        >
          Terms
        </a>
        <a
          className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors uppercase"
          href="/privacy"
        >
          Privacy
        </a>
      </nav>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-8">
        © {new Date().getFullYear()} SAROJ COUTURE. ALL RIGHTS RESERVED.
      </p>
    </footer>
  );
}

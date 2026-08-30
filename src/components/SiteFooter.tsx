/** SiteFooter — shared across all public pages. Server Component. */
export default function SiteFooter() {
  return (
    <footer className="w-full px-margin-mobile md:px-margin-desktop py-12 flex flex-col items-center text-center bg-surface-container border-t border-outline-variant mt-auto">
      <div className="max-w-[1280px] w-full flex flex-col items-center text-center gap-4">
        <h2 className="font-serif text-xl tracking-widest uppercase text-primary font-normal">
          SAROJ COUTURE
        </h2>
        <p className="font-sans text-xs text-on-surface-variant max-w-md tracking-wide">
          Bespoke designer wear and custom stitching atelier in Teka Naka, Kamptee Road, Nagpur.
        </p>
        <nav className="flex flex-wrap justify-center gap-6 md:gap-8 pt-2" aria-label="Footer navigation">
          <a
            className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors uppercase tracking-widest font-medium"
            href="/gallery"
          >
            Gallery
          </a>
          <a
            className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors uppercase tracking-widest font-medium"
            href="/contact"
          >
            Atelier Location &amp; Contact
          </a>
          <a
            className="font-label-md text-xs text-on-surface-variant hover:text-secondary transition-colors uppercase tracking-widest font-medium"
            href="/admin"
          >
            Admin
          </a>
        </nav>
        <div className="w-12 h-px bg-outline-variant my-2" aria-hidden="true" />
        <p className="font-sans text-[11px] text-outline tracking-wider uppercase">
          © {new Date().getFullYear()} SAROJ COUTURE. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}

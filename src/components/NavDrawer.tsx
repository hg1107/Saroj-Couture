"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/supabase/types";

interface NavDrawerProps {
  categories?: Category[];
}

export default function NavDrawer({ categories = [] }: NavDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on Escape and lock background scroll while the drawer is open
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      {/* Menu trigger button */}
      <button
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="nav-drawer"
        onClick={() => setOpen(true)}
        className="hover:opacity-80 transition-opacity active:scale-95 duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary p-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-primary text-2xl">menu</span>
      </button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <aside
        id="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-[#fcf9f4] flex flex-col justify-between py-8 px-6 border-l border-outline-variant shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div>
          {/* Drawer header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-outline-variant">
            <span className="font-serif text-lg text-primary tracking-widest uppercase">
              SAROJ COUTURE
            </span>
            <button
              aria-label="Close navigation menu"
              onClick={() => setOpen(false)}
              className="hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-xl">close</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2" aria-label="Site navigation">
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xs font-label-lg text-label-lg uppercase tracking-widest transition-colors ${
                pathname === "/"
                  ? "bg-surface-container text-secondary font-bold border-l-2 border-secondary"
                  : "text-primary hover:bg-surface-container hover:text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-xl">home</span>
              Home
            </Link>

            <Link
              href="/gallery"
              aria-current={pathname === "/gallery" ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xs font-label-lg text-label-lg uppercase tracking-widest transition-colors ${
                pathname === "/gallery" || pathname?.startsWith("/category")
                  ? "bg-surface-container text-secondary font-bold border-l-2 border-secondary"
                  : "text-primary hover:bg-surface-container hover:text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-xl">photo_library</span>
              Gallery
            </Link>

            {/* Nested Categories if available */}
            {categories.length > 0 && (
              <div className="pl-9 pr-2 py-1 flex flex-col gap-1 border-l border-outline-variant/60 ml-6">
                {categories.map((cat) => {
                  const href = `/category/${cat.slug}`;
                  const active = pathname === href;
                  return (
                    <Link
                      key={cat.id}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`text-xs py-1.5 px-2 rounded-xs font-label-md uppercase tracking-wider transition-colors ${
                        active
                          ? "text-secondary font-bold"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      • {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}

            <Link
              href="/about"
              aria-current={pathname === "/about" ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xs font-label-lg text-label-lg uppercase tracking-widest transition-colors ${
                pathname === "/about"
                  ? "bg-surface-container text-secondary font-bold border-l-2 border-secondary"
                  : "text-primary hover:bg-surface-container hover:text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-xl">info</span>
              About
            </Link>

            <Link
              href="/contact"
              aria-current={pathname === "/contact" ? "page" : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xs font-label-lg text-label-lg uppercase tracking-widest transition-colors ${
                pathname === "/contact"
                  ? "bg-surface-container text-secondary font-bold border-l-2 border-secondary"
                  : "text-primary hover:bg-surface-container hover:text-secondary"
              }`}
            >
              <span className="material-symbols-outlined text-xl">call</span>
              Contact
            </Link>
          </nav>
        </div>

        {/* Drawer footer */}
        <div className="pt-6 border-t border-outline-variant flex flex-col gap-3">
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-xs font-label-md uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">admin_panel_settings</span>
            Admin Portal
          </Link>
          <p className="text-[11px] text-outline">
            Nagpur Atelier • Teka Naka
          </p>
        </div>
      </aside>
    </>
  );
}

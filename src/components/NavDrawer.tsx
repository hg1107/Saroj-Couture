"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/supabase/types";

interface NavDrawerProps {
  categories: Category[];
}

export default function NavDrawer({ categories }: NavDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Menu trigger button */}
      <button
        aria-label="Open navigation menu"
        aria-expanded={open}
        aria-controls="nav-drawer"
        onClick={() => setOpen(true)}
        className="hover:opacity-80 transition-opacity active:scale-95 duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary p-2"
      >
        <span className="material-symbols-outlined text-primary">menu</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-scrim/40"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        id="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-surface-container-low flex flex-col py-8 px-6 border-l border-outline-variant transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between mb-8">
          <span className="font-headline-md text-headline-md text-primary tracking-widest uppercase">
            SAROJ COUTURE
          </span>
          <button
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary p-1"
          >
            <span className="material-symbols-outlined text-primary">close</span>
          </button>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Site navigation">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 p-3 rounded font-label-lg text-label-lg uppercase tracking-widest transition-colors ${
              pathname === "/"
                ? "text-secondary border-b border-secondary font-bold"
                : "text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            <span className="material-symbols-outlined">home</span>
            Home
          </Link>

          {/* Category links */}
          {categories.map((cat) => {
            const href = `/category/${cat.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={cat.id}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 p-3 rounded font-label-lg text-label-lg uppercase tracking-widest transition-colors ${
                  active
                    ? "text-secondary border-b border-secondary font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined">grid_view</span>
                {cat.name}
              </Link>
            );
          })}

          <Link
            href="/#contact"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-3 rounded font-label-lg text-label-lg uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">call</span>
            Contact
          </Link>
        </nav>
      </aside>
    </>
  );
}

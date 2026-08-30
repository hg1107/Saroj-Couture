"use client";

import { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, GarmentStatus } from "@/lib/supabase/types";
import { deleteGarment, toggleGarmentStatus, toggleGarmentFeatured } from "@/lib/actions/garments";
import { formatPrice } from "@/lib/utils/format";

interface GarmentRow {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  price_type: string;
  status: GarmentStatus;
  is_featured: boolean;
  category_id: string;
  categories: { name: string; slug: string } | null;
  images: { url: string; alt_text: string | null; display_order: number }[];
}

interface Props {
  initialGarments: GarmentRow[];
  categories: Category[];
}

export default function GarmentListClient({ initialGarments, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [activeTab, setActiveTab] = useState<"garments" | "categories">("garments");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return initialGarments.filter((g) => {
      const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase());
      const matchCat    = !filterCat || g.category_id === filterCat;
      return matchSearch && matchCat;
    });
  }, [initialGarments, search, filterCat]);

  function handleTabChange(tab: "garments" | "categories") {
    setActiveTab(tab);
    if (tab === "categories") router.push("/admin/categories");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this garment? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteGarment(id);
      router.refresh();
    });
    setMenuOpen(null);
  }

  async function handleToggleStatus(id: string, current: GarmentStatus) {
    startTransition(async () => {
      await toggleGarmentStatus(id, current);
      router.refresh();
    });
    setMenuOpen(null);
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    startTransition(async () => {
      await toggleGarmentFeatured(id, current);
      router.refresh();
    });
    setMenuOpen(null);
  }

  return (
    <main className="flex-grow pt-6 pb-24 px-margin-mobile">
      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-outline-variant mb-8" role="tablist" aria-label="Admin sections">
        <button
          role="tab"
          aria-selected={activeTab === "garments"}
          id="tab-garments"
          aria-controls="panel-garments"
          onClick={() => handleTabChange("garments")}
          className={`flex-1 pb-4 text-center border-b-2 font-label-lg text-label-lg uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
            activeTab === "garments"
              ? "border-secondary text-secondary font-bold"
              : "border-transparent text-on-surface-variant"
          }`}
        >
          Garments
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "categories"}
          id="tab-categories"
          onClick={() => handleTabChange("categories")}
          className="flex-1 pb-4 text-center border-b-2 border-transparent font-label-lg text-label-lg uppercase tracking-[0.1em] text-on-surface-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          Categories
        </button>
      </div>

      {/* ── Search & Filter ───────────────────────────────────────────────── */}
      <div id="panel-garments" role="tabpanel" aria-labelledby="tab-garments" className="flex flex-col gap-4 mb-8">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant ml-2" aria-hidden="true">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search garments…"
            aria-label="Search garments"
            className="w-full bg-transparent border-0 border-b border-outline-variant pl-10 py-2 focus:ring-0 focus:border-secondary font-body-md text-body-md text-on-surface placeholder-on-surface-variant transition-colors"
          />
        </div>

        <div className="relative w-full">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            aria-label="Filter by category"
            className="w-full bg-transparent border-0 border-b border-outline-variant py-2 pl-2 pr-10 appearance-none focus:ring-0 focus:border-secondary font-body-md text-body-md text-on-surface transition-colors"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant mr-2" aria-hidden="true">expand_more</span>
        </div>
      </div>

      {/* ── Garment List ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4" aria-live="polite" aria-busy={isPending}>
        {filtered.length === 0 && (
          <p className="text-on-surface-variant font-body-sm text-body-sm text-center py-8">
            No garments found.
          </p>
        )}
        {filtered.map((g) => {
          const coverImg = g.images.find((i) => i.display_order === 0) ?? g.images[0];
          const isPublished = g.status === "published";
          return (
            <div
              key={g.id}
              className={`flex items-center gap-4 bg-surface-container-lowest p-4 border border-outline-variant rounded-sm ${
                !isPublished ? "opacity-60" : ""
              }`}
            >
              {/* Thumbnail */}
              {coverImg ? (
                <Image
                  src={coverImg.url}
                  alt={coverImg.alt_text ?? g.title}
                  width={56}
                  height={72}
                  className="w-14 h-[72px] object-cover rounded-sm bg-surface-variant flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-[72px] rounded-sm bg-surface-variant flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-outline text-sm" aria-hidden="true">image</span>
                </div>
              )}

              {/* Info */}
              <div className="flex-grow flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${isPublished ? "bg-secondary" : "border border-outline-variant"}`}
                    aria-hidden="true"
                  />
                  <h3 className="font-body-lg text-body-lg text-primary truncate">{g.title}</h3>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant uppercase mb-1 block">
                  {g.categories?.name ?? "—"}
                </span>
                <span className="font-body-md text-body-md text-on-surface">
                  {formatPrice(g.price, g.price_type)}
                </span>
              </div>

              {/* Overflow menu */}
              <div className="relative">
                <button
                  aria-label={`Options for ${g.title}`}
                  aria-expanded={menuOpen === g.id}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen(menuOpen === g.id ? null : g.id)}
                  className="text-on-surface-variant p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
                </button>

                {menuOpen === g.id && (
                  <>
                    <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(null)} />
                    <ul
                      role="menu"
                      aria-label={`Options for ${g.title}`}
                      className="absolute right-0 top-full mt-1 z-20 bg-surface-container-lowest border border-outline-variant rounded-sm w-44 py-1"
                    >
                      <li role="none">
                        <Link
                          href={`/admin/garments/${g.id}`}
                          role="menuitem"
                          className="block px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                          onClick={() => setMenuOpen(null)}
                        >
                          Edit
                        </Link>
                      </li>
                      <li role="none">
                        <button
                          role="menuitem"
                          onClick={() => handleToggleStatus(g.id, g.status)}
                          className="w-full text-left px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                        >
                          {isPublished ? "Hide" : "Publish"}
                        </button>
                      </li>
                      <li role="none">
                        <button
                          role="menuitem"
                          onClick={() => handleToggleFeatured(g.id, g.is_featured)}
                          className="w-full text-left px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                        >
                          {g.is_featured ? "Remove from featured" : "Add to featured"}
                        </button>
                      </li>
                      <li role="separator" className="border-t border-outline-variant my-1" />
                      <li role="none">
                        <button
                          role="menuitem"
                          onClick={() => handleDelete(g.id)}
                          className="w-full text-left px-4 py-2 font-body-sm text-body-sm text-error hover:bg-error-container transition-colors"
                        >
                          Delete
                        </button>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FAB — Add Garment ─────────────────────────────────────────────── */}
      <Link
        href="/admin/garments/new"
        aria-label="Add new garment"
        className="fixed bottom-22 right-margin-mobile w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity z-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary"
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
      </Link>
    </main>
  );
}

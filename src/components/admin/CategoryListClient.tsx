"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/supabase/types";
import {
  deleteCategory,
  toggleCategoryVisibility,
  reorderCategories,
  createCategory,
} from "@/lib/actions/categories";

interface Props {
  categories: Category[];
  garmentCounts: Record<string, number>;
}

export default function CategoryListClient({ categories: initial, garmentCounts }: Props) {
  const router               = useRouter();
  const [isPending, startT]  = useTransition();
  const [items, setItems]    = useState(initial);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [menuOpen, setMenuOpen]         = useState<string | null>(null);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [newName, setNewName]           = useState("");
  const [addError, setAddError]         = useState("");

  // ── Drag-reorder (simple swap) ─────────────────────────────────────────
  const [dragging, setDragging] = useState<string | null>(null);

  function handleDragStart(id: string) { setDragging(id); }
  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragging || dragging === targetId) return;
    const from = items.findIndex((c) => c.id === dragging);
    const to   = items.findIndex((c) => c.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...items];
    next.splice(to, 0, next.splice(from, 1)[0]);
    setItems(next);
  }
  async function handleDrop() {
    if (!dragging) return;
    setDragging(null);
    startT(async () => {
      await reorderCategories(items.map((c) => c.id));
      router.refresh();
    });
  }

  // ── Visibility toggle ──────────────────────────────────────────────────
  function handleToggleVisibility(cat: Category) {
    startT(async () => {
      await toggleCategoryVisibility(cat.id, cat.is_visible);
      router.refresh();
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    startT(async () => {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  // ── Add category ───────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (!newName.trim()) { setAddError("Name is required."); return; }
    const fd = new FormData();
    fd.append("name", newName.trim());
    fd.append("is_visible", "on");
    startT(async () => {
      const result = await createCategory(undefined as any, fd);
      if (result?.error) { setAddError(result.error); return; }
      setNewName("");
      setShowAddForm(false);
      router.refresh();
    });
  }

  return (
    <main className="pt-6 pb-24 px-margin-mobile">
      {/* ── Back nav ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/garments"
          aria-label="Back to garments"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        >
          <span className="material-symbols-outlined text-on-surface" aria-hidden="true">arrow_back</span>
        </Link>
        <h1 className="font-headline-md text-headline-md text-primary tracking-widest uppercase">
          Categories
        </h1>
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant mb-8">
        Organize your collections. Drag to reorder.
      </p>

      {/* ── Category List ─────────────────────────────────────────────────── */}
      <ul className="flex flex-col border-t border-outline-variant" aria-label="Categories">
        {items.map((cat) => (
          <li
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(cat.id)}
            onDragOver={(e) => handleDragOver(e, cat.id)}
            onDrop={handleDrop}
            onDragEnd={handleDrop}
            className={`flex items-center justify-between py-4 border-b border-outline-variant bg-surface-container-lowest transition-opacity ${
              !cat.is_visible ? "opacity-75" : ""
            } ${dragging === cat.id ? "opacity-50" : ""}`}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Drag handle */}
              <span
                className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing"
                aria-hidden="true"
                title="Drag to reorder"
              >
                drag_indicator
              </span>

              {/* Cover thumbnail */}
              <div className="w-12 h-12 rounded bg-surface-variant border border-outline-variant overflow-hidden shrink-0">
                {cat.cover_image_url ? (
                  <Image
                    src={cat.cover_image_url}
                    alt={cat.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-outline text-sm" aria-hidden="true">image</span>
                  </div>
                )}
              </div>

              {/* Name + count */}
              <div className="flex flex-col min-w-0">
                <span className="font-label-lg text-label-lg text-on-surface truncate">{cat.name}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {garmentCounts[cat.id] ?? 0} {garmentCounts[cat.id] === 1 ? "piece" : "pieces"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Visibility toggle */}
              <button
                onClick={() => handleToggleVisibility(cat)}
                aria-label={cat.is_visible ? `Hide ${cat.name}` : `Show ${cat.name}`}
                aria-pressed={cat.is_visible}
                className="text-outline hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded p-1"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  {cat.is_visible ? "visibility" : "visibility_off"}
                </span>
              </button>

              {/* Overflow menu */}
              <div className="relative">
                <button
                  aria-label={`Options for ${cat.name}`}
                  aria-expanded={menuOpen === cat.id}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen(menuOpen === cat.id ? null : cat.id)}
                  className="text-on-surface cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded p-1"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">more_vert</span>
                </button>

                {menuOpen === cat.id && (
                  <>
                    <div className="fixed inset-0 z-10" aria-hidden="true" onClick={() => setMenuOpen(null)} />
                    <ul
                      role="menu"
                      aria-label={`Options for ${cat.name}`}
                      className="absolute right-0 top-full mt-1 z-20 bg-surface-container-lowest border border-outline-variant rounded-sm w-36 py-1"
                    >
                      <li role="none">
                        <button
                          role="menuitem"
                          onClick={() => { setDeleteTarget(cat); setMenuOpen(null); }}
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
          </li>
        ))}
      </ul>

      {/* ── Add Category ───────────────────────────────────────────────────── */}
      <div className="mt-8">
        {showAddForm ? (
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Category name"
              autoFocus
              aria-label="New category name"
              className="w-full border-0 border-b border-outline-variant bg-transparent py-2 font-body-md text-body-md text-primary placeholder-outline focus:ring-0 focus:border-primary transition-colors"
            />
            {addError && (
              <p role="alert" className="font-body-sm text-body-sm text-error">{addError}</p>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isPending}
                className="font-label-lg text-label-lg text-on-secondary bg-secondary px-6 py-2 rounded-sm uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {isPending ? "Saving…" : "Add"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setNewName(""); setAddError(""); }}
                className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 font-label-lg text-label-lg text-secondary uppercase tracking-widest hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
          >
            <span className="material-symbols-outlined" aria-hidden="true">add</span>
            Add category
          </button>
        )}
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim/40 p-margin-mobile"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
        >
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-lg border border-outline-variant flex flex-col p-6">
            <h2 id="delete-dialog-title" className="font-headline-md text-headline-md text-primary mb-2">
              Delete category?
            </h2>
            <p id="delete-dialog-desc" className="font-body-md text-body-md text-on-surface-variant mb-6">
              Are you sure you want to delete &ldquo;{deleteTarget.name}&rdquo;? Any pieces currently assigned here will be moved to &lsquo;Uncategorised&rsquo;.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="w-full py-3 bg-error text-on-error font-label-lg text-label-lg uppercase tracking-widest rounded-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                className="w-full py-3 border border-outline-variant text-on-surface font-label-lg text-label-lg uppercase tracking-widest rounded-sm transition-colors hover:bg-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/supabase/types";
import {
  deleteCategory,
  toggleCategoryVisibility,
  reorderCategories,
  createCategory,
  updateCategory,
} from "@/lib/actions/categories";

interface Props {
  categories: Category[];
  garmentCounts: Record<string, number>;
}

const UNCATEGORISED_SLUG = "uncategorised";

export default function CategoryListClient({ categories: initial, garmentCounts }: Props) {
  const router              = useRouter();
  const [isPending, startT] = useTransition();

  // The "Uncategorised" fallback is a system row: no drag, no delete, no
  // hiding it — it must always exist and always sort last.
  const [items, setItems]         = useState(initial.filter((c) => c.slug !== UNCATEGORISED_SLUG));
  const [systemCat, setSystemCat] = useState(initial.find((c) => c.slug === UNCATEGORISED_SLUG) ?? null);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [menuOpen, setMenuOpen]         = useState<string | null>(null);
  const [addError, setAddError]         = useState("");

  // ── Inline rename ────────────────────────────────────────────────────────
  const [renamingId, setRenamingId]   = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function patchCategory(id: string, patch: Partial<Category>) {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    setSystemCat((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  }

  function startRename(cat: Category) {
    setRenamingId(cat.id);
    setRenameValue(cat.name);
    setMenuOpen(null);
  }

  function commitRename(cat: Category) {
    const value = renameValue.trim();
    setRenamingId(null);
    if (!value || value === cat.name) return;
    patchCategory(cat.id, { name: value });
    startT(async () => {
      const fd = new FormData();
      fd.set("name", value);
      const result = await updateCategory(cat.id, undefined, fd);
      if (result.error) patchCategory(cat.id, { name: cat.name });
      router.refresh();
    });
  }

  // ── Cover image (real upload — already-built storage pipeline) ──────────
  const coverFileInputRef        = useRef<HTMLInputElement>(null);
  const [coverTargetId, setCoverTargetId] = useState<string | null>(null);

  function handleChangeCoverClick(cat: Category) {
    setCoverTargetId(cat.id);
    setMenuOpen(null);
    coverFileInputRef.current?.click();
  }

  function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const targetId = coverTargetId;
    e.target.value = "";
    if (!file || !targetId) return;
    startT(async () => {
      const fd = new FormData();
      fd.set("cover_image", file);
      await updateCategory(targetId, undefined, fd);
      router.refresh();
    });
  }

  // ── Drag-to-reorder (pointer events — works for mouse, touch, and pen) ──
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const [dragId, setDragId] = useState<string | null>(null);

  function setItemRef(id: string) {
    return (el: HTMLLIElement | null) => {
      if (el) itemRefs.current.set(id, el);
      else itemRefs.current.delete(id);
    };
  }

  function getIndexAtY(y: number): number {
    for (let i = 0; i < items.length; i++) {
      const el = itemRefs.current.get(items[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y < rect.top + rect.height / 2) return i;
    }
    return items.length - 1;
  }

  function handlePointerDown(e: React.PointerEvent, id: string) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(id);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragId) return;
    const fromIndex = items.findIndex((c) => c.id === dragId);
    const toIndex   = getIndexAtY(e.clientY);
    if (fromIndex === -1 || toIndex === fromIndex) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function finishDrag() {
    if (!dragId) return;
    setDragId(null);
    startT(async () => {
      await reorderCategories(items.map((c) => c.id));
      router.refresh();
    });
  }

  // ── Visibility toggle ──────────────────────────────────────────────────
  function handleToggleVisibility(cat: Category) {
    patchCategory(cat.id, { is_visible: !cat.is_visible });
    startT(async () => {
      await toggleCategoryVisibility(cat.id, cat.is_visible);
      router.refresh();
    });
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    startT(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        setDeleteTarget(null);
        setAddError(result.error);
        return;
      }
      setItems((prev) => prev.filter((c) => c.id !== id));
      setDeleteTarget(null);
      router.refresh();
    });
  }

  // ── Add category — creates the row immediately, then opens it for rename ─
  function handleAddCategory() {
    setAddError("");
    startT(async () => {
      const fd = new FormData();
      fd.set("name", "New Category");
      fd.set("display_order", String(items.length));
      const result = await createCategory(undefined, fd);
      if (result.error || !result.id) {
        setAddError(result.error ?? "Could not create category.");
        return;
      }
      const newCat: Category = {
        id: result.id,
        name: "New Category",
        slug: "",
        display_order: items.length,
        cover_image_url: null,
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newCat]);
      setRenamingId(newCat.id);
      setRenameValue(newCat.name);
    });
  }

  function renderRow(cat: Category, opts: { system: boolean }) {
    const count = garmentCounts[cat.id] ?? 0;
    const isRenaming = renamingId === cat.id;

    return (
      <li
        key={cat.id}
        ref={opts.system ? undefined : setItemRef(cat.id)}
        className={`flex items-center justify-between py-4 border-b border-outline-variant bg-surface-container-lowest transition-opacity select-none ${
          !cat.is_visible ? "opacity-75" : ""
        } ${dragId === cat.id ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Drag handle (hidden for the system row — it always sorts last) */}
          {opts.system ? (
            <span className="material-symbols-outlined text-outline-variant w-6 text-center" aria-hidden="true" title="System category">
              lock
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-outline cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              aria-hidden="true"
              title="Drag to reorder"
              onPointerDown={(e) => handlePointerDown(e, cat.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
            >
              drag_indicator
            </span>
          )}

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
          <div className="flex flex-col min-w-0 flex-1">
            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                autoFocus
                onFocus={(e) => e.target.select()}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => commitRename(cat)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitRename(cat); }
                  if (e.key === "Escape") { e.preventDefault(); setRenamingId(null); }
                }}
                aria-label={`Rename ${cat.name}`}
                className="w-full border-0 border-b border-primary bg-transparent py-0.5 font-label-lg text-label-lg text-on-surface focus:ring-0 focus:outline-none"
              />
            ) : (
              <span className="font-label-lg text-label-lg text-on-surface truncate">{cat.name}</span>
            )}
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              {count} {count === 1 ? "piece" : "pieces"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Visibility toggle */}
          <button
            onClick={() => handleToggleVisibility(cat)}
            disabled={opts.system}
            aria-label={cat.is_visible ? `Hide ${cat.name}` : `Show ${cat.name}`}
            aria-pressed={cat.is_visible}
            title={opts.system ? "Always hidden from the public site" : undefined}
            className="text-outline hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded p-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-outline"
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
                  className="absolute right-0 top-full mt-1 z-20 bg-surface-container-lowest border border-outline-variant rounded-sm w-44 py-1"
                >
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={() => startRename(cat)}
                      className="w-full text-left px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Rename
                    </button>
                  </li>
                  <li role="none">
                    <button
                      role="menuitem"
                      onClick={() => handleChangeCoverClick(cat)}
                      className="w-full text-left px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container transition-colors"
                    >
                      Change cover
                    </button>
                  </li>
                  {!opts.system && (
                    <>
                      <li role="separator" className="border-t border-outline-variant my-1" />
                      <li role="none">
                        <button
                          role="menuitem"
                          onClick={() => { setDeleteTarget(cat); setMenuOpen(null); }}
                          className="w-full text-left px-4 py-2 font-body-sm text-body-sm text-error hover:bg-error-container transition-colors"
                        >
                          Delete
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      </li>
    );
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
      <ul className="flex flex-col border-t border-outline-variant" aria-label="Categories" aria-busy={isPending}>
        {items.map((cat) => renderRow(cat, { system: false }))}
        {systemCat && renderRow(systemCat, { system: true })}
      </ul>

      {/* Shared hidden file input for "Change cover" */}
      <input
        ref={coverFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ── Add Category ───────────────────────────────────────────────────── */}
      <div className="mt-8">
        <button
          onClick={handleAddCategory}
          disabled={isPending}
          className="flex items-center gap-2 font-label-lg text-label-lg text-secondary uppercase tracking-widest hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded disabled:opacity-60"
        >
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
          Add category
        </button>
        {addError && (
          <p role="alert" className="font-body-sm text-body-sm text-error mt-2">{addError}</p>
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
              {(() => {
                const count = garmentCounts[deleteTarget.id] ?? 0;
                return count > 0 ? (
                  <>
                    &ldquo;{deleteTarget.name}&rdquo; contains {count} {count === 1 ? "garment" : "garments"}.
                    {" "}Deleting it will move {count === 1 ? "that garment" : "them"} to &lsquo;Uncategorised&rsquo; — no garments will be deleted.
                  </>
                ) : (
                  <>&ldquo;{deleteTarget.name}&rdquo; has no garments in it. It will be deleted permanently.</>
                );
              })()}
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

"use client";

import { useState, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import type { Category, GarmentWithImages, PriceType } from "@/lib/supabase/types";
import { createGarment, updateGarment, type GarmentFormState } from "@/lib/actions/garments";
import { createCategory } from "@/lib/actions/categories";

interface Props {
  categories: Category[];
  garment?: GarmentWithImages; // provided when editing
}

const initialState: GarmentFormState = {};
const DESCRIPTION_MAX = 300;
const MAX_IMAGES = 6;

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function GarmentFormClient({ categories, garment }: Props) {
  const router = useRouter();
  const isEdit = !!garment;

  // ── Local state ──────────────────────────────────────────────────────────
  const [priceType, setPriceType] = useState<PriceType>(garment?.price_type ?? "fixed");
  const [descCount, setDescCount] = useState((garment?.description ?? "").length);

  // Category dropdown + inline "+ New category"
  const [localCategories, setLocalCategories] = useState(categories);
  const [categoryId, setCategoryId] = useState(garment?.category_id ?? "");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryError, setNewCategoryError] = useState<string | undefined>();
  const [isCategoryPending, startCategoryTransition] = useTransition();

  // Images — Phase 6 will add real uploads; for now the owner pastes in
  // URLs of images already uploaded elsewhere (e.g. to Supabase Storage).
  const [imageUrls, setImageUrls] = useState<string[]>(
    (garment?.images ?? []).map((img) => img.url)
  );
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageUrlError, setImageUrlError] = useState<string | undefined>();

  const [, startRedirectTransition] = useTransition();

  // Server Action binding
  const action = isEdit
    ? updateGarment.bind(null, garment!.id)
    : createGarment;

  const [state, formAction, isPending] = useActionState(action, initialState);

  function goToList() {
    router.push("/admin/garments");
  }

  // ── Inline category creation ─────────────────────────────────────────────
  function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setNewCategoryError(undefined);
    startCategoryTransition(async () => {
      const fd = new FormData();
      fd.set("name", name);
      const result = await createCategory(undefined, fd);
      if (result.error || !result.id) {
        setNewCategoryError(result.error ?? "Could not create category.");
        return;
      }
      const newCategory: Category = {
        id: result.id,
        name,
        slug: "",
        display_order: localCategories.length,
        cover_image_url: null,
        is_visible: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLocalCategories((prev) => [...prev, newCategory]);
      setCategoryId(result.id);
      setNewCategoryName("");
      setShowNewCategory(false);
    });
  }

  // ── Image URL list ───────────────────────────────────────────────────────
  function handleAddImageUrl() {
    const url = imageUrlInput.trim();
    if (!url) return;
    if (!isValidUrl(url)) {
      setImageUrlError("Enter a full URL, e.g. https://…");
      return;
    }
    setImageUrls((prev) => [...prev, url]);
    setImageUrlInput("");
    setImageUrlError(undefined);
  }

  function removeImageUrl(index: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Success redirect ─────────────────────────────────────────────────────
  if (state?.success) {
    startRedirectTransition(() => router.push("/admin/garments"));
  }

  return (
    <div className="pt-16 pb-24 px-margin-mobile">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <button
          type="button"
          aria-label="Cancel and return to garment list"
          onClick={goToList}
          className="hover:opacity-80 transition-opacity flex items-center justify-center p-2 -ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        >
          <span className="material-symbols-outlined text-primary" aria-hidden="true">close</span>
        </button>
        <h1 className="font-headline-md text-headline-md">
          {isEdit ? "Edit Garment" : "Add Garment"}
        </h1>
        <div className="w-10" aria-hidden />
      </div>

      {/* ── Image URLs (placeholder — real upload UI lands in Phase 6) ────── */}
      <section className="mb-10" aria-label="Garment images">
        <label htmlFor="image_url_input" className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider block">
          Image URLs
        </label>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
          Paste the URL of an already-uploaded image. Direct upload is coming soon.
        </p>

        {imageUrls.length < MAX_IMAGES && (
          <div className="flex gap-2">
            <input
              id="image_url_input"
              type="url"
              value={imageUrlInput}
              onChange={(e) => { setImageUrlInput(e.target.value); setImageUrlError(undefined); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleAddImageUrl(); }
              }}
              placeholder="https://…"
              className="flex-grow border-0 border-b border-outline-variant bg-transparent py-2 font-body-md text-body-md text-primary placeholder-outline focus:ring-0 focus:border-primary transition-colors"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-4 py-2 border border-outline-variant rounded-sm font-label-md text-label-md uppercase tracking-wider text-primary hover:bg-surface-container-low transition-colors"
            >
              Add
            </button>
          </div>
        )}
        {imageUrlError && (
          <p role="alert" className="font-body-sm text-body-sm text-error mt-1">{imageUrlError}</p>
        )}

        {/* Thumbnails */}
        {imageUrls.length > 0 && (
          <div className="flex gap-4 mt-4 overflow-x-auto pb-2 snap-x" role="list" aria-label="Selected images">
            {imageUrls.map((url, i) => (
              <div
                key={`${url}-${i}`}
                role="listitem"
                className="relative w-24 h-24 shrink-0 snap-start bg-surface-container-lowest border border-outline-variant flex items-center justify-center rounded group overflow-hidden"
              >
                {/* Arbitrary pasted URLs aren't covered by next/image's remotePatterns allowlist */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={i === 0 ? "Cover image" : `Image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => removeImageUrl(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                >
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">close</span>
                </button>
                {i === 0 && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-surface-container text-on-surface font-label-md text-[10px] px-2 py-0.5 border border-outline-variant tracking-wider uppercase whitespace-nowrap">
                    Cover
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Submitted with the form, in display order */}
        {imageUrls.map((url, i) => (
          <input key={`${url}-${i}`} type="hidden" name="image_urls" value={url} />
        ))}
      </section>

      {/* ── Form Fields ───────────────────────────────────────────────────── */}
      <form action={formAction} className="flex flex-col gap-8">
        {/* Title */}
        <div className="flex flex-col">
          <label htmlFor="title" className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={garment?.title}
            placeholder="e.g. Silk Organza Saree"
            className="w-full border-0 border-b border-outline-variant bg-transparent py-2 font-body-lg text-body-lg text-primary placeholder-outline focus:ring-0 focus:border-primary transition-colors"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col">
          <div className="flex justify-between items-end mb-1">
            <label htmlFor="category_id" className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowNewCategory((v) => !v)}
              className="font-label-md text-label-md text-secondary uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              + New category
            </button>
          </div>
          <div className="relative">
            <select
              id="category_id"
              name="category_id"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border-0 border-b border-outline-variant bg-transparent py-2 font-body-lg text-body-lg text-primary appearance-none focus:ring-0 focus:border-primary transition-colors"
            >
              <option value="" disabled>Select category</option>
              {localCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline" aria-hidden="true">expand_more</span>
          </div>

          {showNewCategory && (
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); }
                }}
                placeholder="New category name"
                aria-label="New category name"
                disabled={isCategoryPending}
                className="flex-grow border-0 border-b border-outline-variant bg-transparent py-2 font-body-md text-body-md text-primary placeholder-outline focus:ring-0 focus:border-primary transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={isCategoryPending || !newCategoryName.trim()}
                className="px-4 py-2 border border-outline-variant rounded-sm font-label-md text-label-md uppercase tracking-wider text-primary hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCategoryPending ? "Adding…" : "Add"}
              </button>
            </div>
          )}
          {newCategoryError && (
            <p role="alert" className="font-body-sm text-body-sm text-error mt-1">{newCategoryError}</p>
          )}
        </div>

        {/* Fabric */}
        <div className="flex flex-col">
          <label htmlFor="fabric" className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
            Fabric
          </label>
          <input
            id="fabric"
            name="fabric"
            type="text"
            defaultValue={garment?.fabric ?? ""}
            placeholder="e.g. Pure Georgette"
            className="w-full border-0 border-b border-outline-variant bg-transparent py-2 font-body-lg text-body-lg text-primary placeholder-outline focus:ring-0 focus:border-primary transition-colors"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col">
          <label htmlFor="description" className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={DESCRIPTION_MAX}
            defaultValue={garment?.description ?? ""}
            placeholder="Describe the garment details…"
            onChange={(e) => setDescCount(e.target.value.length)}
            className="w-full border-0 border-b border-outline-variant bg-transparent py-2 font-body-lg text-body-lg text-primary placeholder-outline resize-none focus:ring-0 focus:border-primary transition-colors"
          />
          <div className="text-right font-body-sm text-body-sm text-on-surface-variant mt-1" aria-live="polite">
            {descCount}/{DESCRIPTION_MAX}
          </div>
        </div>

        {/* Price Type */}
        <fieldset>
          <legend className="font-label-md text-label-md text-on-surface-variant mb-3 uppercase tracking-wider">
            Price Type
          </legend>
          <div className="flex gap-4 flex-wrap">
            {(["fixed", "starting_from", "on_enquiry"] as PriceType[]).map((type) => {
              const labels: Record<PriceType, string> = {
                fixed: "Fixed",
                starting_from: "Starting from",
                on_enquiry: "On enquiry",
              };
              const selected = priceType === type;
              return (
                <label
                  key={type}
                  className={`cursor-pointer px-4 py-2 border rounded font-body-sm text-body-sm text-on-surface transition-colors flex items-center gap-2 ${
                    selected ? "border-primary bg-surface-container" : "border-outline-variant"
                  }`}
                >
                  <input
                    type="radio"
                    name="price_type"
                    value={type}
                    checked={selected}
                    onChange={() => setPriceType(type)}
                    className="sr-only"
                  />
                  <span
                    className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      selected ? "border-primary" : "border-outline-variant"
                    }`}
                    aria-hidden="true"
                  >
                    {selected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </span>
                  {labels[type]}
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Price — hidden entirely when priced "on enquiry" */}
        {priceType !== "on_enquiry" && (
          <div className="flex flex-col">
            <label htmlFor="price" className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">
              Price (₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-0 font-body-lg text-body-lg text-on-surface-variant" aria-hidden="true">₹</span>
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                step={1}
                defaultValue={garment?.price ?? ""}
                placeholder="0"
                className="w-full border-0 border-b border-outline-variant bg-transparent py-2 pl-6 font-body-lg text-body-lg text-primary placeholder-outline focus:ring-0 focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* Toggles */}
        <div className="flex flex-col gap-6 mt-4 pt-8 border-t border-outline-variant">
          {/* Feature on homepage */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-md text-body-md text-primary">Feature on homepage</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Display this item prominently</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer" aria-label="Feature on homepage">
              <input
                type="checkbox"
                name="is_featured"
                value="on"
                defaultChecked={garment?.is_featured ?? false}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors" />
              <div className="absolute left-[2px] top-[2px] bg-white border border-outline-variant w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
            </label>
          </div>

          {/* Publish now */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-body-md text-body-md text-primary">Publish now</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Make visible to customers immediately</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer" aria-label="Publish now">
              <input
                type="checkbox"
                name="status"
                value="on"
                defaultChecked={garment ? garment.status === "published" : true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-primary transition-colors" />
              <div className="absolute left-[2px] top-[2px] bg-white border border-outline-variant w-5 h-5 rounded-full transition-transform peer-checked:translate-x-5" />
            </label>
          </div>
        </div>

        {/* Error */}
        {state?.error && (
          <p role="alert" aria-live="polite" className="font-body-sm text-body-sm text-error">
            {state.error}
          </p>
        )}

        {/* Sticky footer buttons */}
        <div className="fixed bottom-0 left-0 w-full bg-background border-t border-outline-variant px-margin-mobile py-4 flex flex-col gap-4 z-40">
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-secondary text-on-secondary font-label-lg text-label-lg uppercase tracking-wider py-4 rounded-sm border border-secondary text-center disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Garment"}
          </button>
          <button
            type="button"
            onClick={goToList}
            className="w-full text-primary font-label-md text-label-md uppercase tracking-wider py-2 text-center underline hover:opacity-70 transition-opacity"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

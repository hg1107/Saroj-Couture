"use client";

import { useState, useRef, useTransition, useActionState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Category, GarmentWithImages, PriceType } from "@/lib/supabase/types";
import { createGarment, updateGarment, type GarmentFormState } from "@/lib/actions/garments";

interface Props {
  categories: Category[];
  garment?: GarmentWithImages; // provided when editing
}

const initialState: GarmentFormState = {};

export default function GarmentFormClient({ categories, garment }: Props) {
  const router          = useRouter();
  const isEdit          = !!garment;
  const [, startTrans]  = useTransition();
  const fileInputRef    = useRef<HTMLInputElement>(null);

  // ── Local state ──────────────────────────────────────────────────────────
  const [priceType, setPriceType] = useState<PriceType>(garment?.price_type ?? "fixed");
  const [descCount, setDescCount] = useState((garment?.description ?? "").length);

  // Preview images (existing + newly picked)
  const [previews, setPreviews] = useState<{ id: string; url: string; isNew: boolean }[]>(
    (garment?.images ?? []).map((img) => ({ id: img.id, url: img.url, isNew: false }))
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // Server Action binding
  const action = isEdit
    ? updateGarment.bind(null, garment!.id)
    : createGarment;

  const [state, formAction, isPending] = useActionState(action, initialState);

  // ── Image picking ────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 6 - previews.length;
    const picked = files.slice(0, remaining);
    const newPreviews = picked.map((f) => ({
      id: URL.createObjectURL(f),
      url: URL.createObjectURL(f),
      isNew: true,
    }));
    setPreviews((p) => [...p, ...newPreviews]);
    setNewFiles((prev) => [...prev, ...picked]);
  }

  function removePreview(id: string) {
    setPreviews((p) => p.filter((img) => img.id !== id));
    setNewFiles((f) => f); // file removal handled by FormData reconstruction
  }

  // ── Success redirect ─────────────────────────────────────────────────────
  if (state?.success) {
    startTrans(() => router.push("/admin/garments"));
  }

  return (
    <div className="pt-16 pb-24 px-margin-mobile">
      {/* Header */}
      <div className="flex items-center justify-between py-6">
        <button
          type="button"
          aria-label="Cancel and go back"
          onClick={() => router.back()}
          className="hover:opacity-80 transition-opacity flex items-center justify-center p-2 -ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        >
          <span className="material-symbols-outlined text-primary" aria-hidden="true">close</span>
        </button>
        <h1 className="font-headline-md text-headline-md">
          {isEdit ? "Edit Garment" : "Add Garment"}
        </h1>
        <div className="w-10" aria-hidden />
      </div>

      {/* ── Image Uploader ────────────────────────────────────────────────── */}
      <section className="mb-10" aria-label="Garment images">
        {previews.length < 6 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-outline-variant bg-surface-container-lowest h-40 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            aria-label="Add photos"
          >
            <span className="material-symbols-outlined text-outline mb-2 text-3xl" aria-hidden="true">photo_camera</span>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Add photos — up to {6 - previews.length} more
            </p>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          name="images"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Thumbnails */}
        {previews.length > 0 && (
          <div className="flex gap-4 mt-4 overflow-x-auto pb-2 snap-x" role="list" aria-label="Selected images">
            {previews.map((img, i) => (
              <div
                key={img.id}
                role="listitem"
                className="relative w-24 h-24 shrink-0 snap-start bg-surface-container-lowest border border-outline-variant flex items-center justify-center rounded group"
              >
                <Image
                  src={img.url}
                  alt={i === 0 ? "Cover image" : `Image ${i + 1}`}
                  fill
                  className="object-cover rounded-sm"
                  unoptimized={img.isNew}
                />
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => removePreview(img.id)}
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
          </div>
          <div className="relative">
            <select
              id="category_id"
              name="category_id"
              required
              defaultValue={garment?.category_id ?? ""}
              className="w-full border-0 border-b border-outline-variant bg-transparent py-2 font-body-lg text-body-lg text-primary appearance-none focus:ring-0 focus:border-primary transition-colors"
            >
              <option value="" disabled>Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline" aria-hidden="true">expand_more</span>
          </div>
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
            maxLength={500}
            defaultValue={garment?.description ?? ""}
            placeholder="Describe the garment details…"
            onChange={(e) => setDescCount(e.target.value.length)}
            className="w-full border-0 border-b border-outline-variant bg-transparent py-2 font-body-lg text-body-lg text-primary placeholder-outline resize-none focus:ring-0 focus:border-primary transition-colors"
          />
          <div className="text-right font-body-sm text-body-sm text-on-surface-variant mt-1" aria-live="polite">
            {descCount}/500
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

        {/* Price */}
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
            onClick={() => router.back()}
            className="w-full text-primary font-label-md text-label-md uppercase tracking-wider py-2 text-center underline hover:opacity-70 transition-opacity"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

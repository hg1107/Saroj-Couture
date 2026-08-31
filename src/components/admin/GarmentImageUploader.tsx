"use client";

import { useRef, useState } from "react";

const MAX_IMAGES = 6;
const UPLOAD_URL = "/api/admin/garment-images";

// Only allow image-safe URL schemes as an <img src>. Blocks scheme-based
// injection (e.g. "javascript:") from a compromised upload response or
// stored garment record before it ever reaches the DOM.
function isSafeImageUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url, window.location.origin);
    return protocol === "http:" || protocol === "https:" || protocol === "blob:";
  } catch {
    return false;
  }
}

interface ImageSlot {
  id: string;           // once uploaded, doubles as the Storage path segment
  previewUrl: string;
  status: "uploading" | "done" | "error";
  progress: number;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface InitialImage {
  id: string;
  url: string;
  thumbnailUrl: string;
}

interface Props {
  garmentId: string;
  initialImages: InitialImage[];
}

function uploadWithProgress(
  file: File,
  garmentId: string,
  onProgress: (pct: number) => void,
  xhrHolder: { current: XMLHttpRequest | null }
): Promise<{ id: string; url: string; thumbnailUrl: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrHolder.current = xhr;
    xhr.open("POST", UPLOAD_URL);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      let data: Record<string, unknown> | null = null;
      try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
      if (xhr.status >= 200 && xhr.status < 300 && data) {
        resolve(data as { id: string; url: string; thumbnailUrl: string });
      } else {
        reject(new Error((data?.error as string) || `Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));

    const fd = new FormData();
    fd.set("file", file);
    fd.set("garmentId", garmentId);
    xhr.send(fd);
  });
}

export default function GarmentImageUploader({ garmentId, initialImages }: Props) {
  const [slots, setSlots] = useState<ImageSlot[]>(
    initialImages
      .filter((img) => isSafeImageUrl(img.thumbnailUrl) && isSafeImageUrl(img.url))
      .map((img) => ({
        id: img.id,
        previewUrl: img.thumbnailUrl,
        status: "done",
        progress: 100,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
      }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRefs = useRef<Map<string, { current: XMLHttpRequest | null }>>(new Map());

  // ── Reorder (pointer events — mouse, touch, and pen) ────────────────────
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [dragId, setDragId] = useState<string | null>(null);

  function setItemRef(id: string) {
    return (el: HTMLDivElement | null) => {
      if (el) itemRefs.current.set(id, el);
      else itemRefs.current.delete(id);
    };
  }

  function getIndexAtX(x: number): number {
    for (let i = 0; i < slots.length; i++) {
      const el = itemRefs.current.get(slots[i].id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x < rect.left + rect.width / 2) return i;
    }
    return slots.length - 1;
  }

  function handlePointerDown(e: React.PointerEvent, id: string) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragId(id);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragId) return;
    const fromIndex = slots.findIndex((s) => s.id === dragId);
    const toIndex = getIndexAtX(e.clientX);
    if (fromIndex === -1 || toIndex === fromIndex) return;
    setSlots((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }
  function finishDrag() { setDragId(null); }

  // ── Upload ────────────────────────────────────────────────────────────
  function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_IMAGES - slots.length);
    e.target.value = "";

    for (const file of files) {
      const id = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setSlots((prev) => [...prev, { id, previewUrl, status: "uploading", progress: 0 }]);

      const xhrHolder = { current: null as XMLHttpRequest | null };
      xhrRefs.current.set(id, xhrHolder);

      uploadWithProgress(
        file,
        garmentId,
        (pct) => setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, progress: pct } : s))),
        xhrHolder
      )
        .then(({ id: serverId, url, thumbnailUrl }) => {
          if (!isSafeImageUrl(url) || !isSafeImageUrl(thumbnailUrl)) {
            throw new Error("Upload returned an invalid image URL");
          }
          setSlots((prev) =>
            prev.map((s) =>
              s.id === id
                ? { ...s, id: serverId, status: "done", progress: 100, url, thumbnailUrl, previewUrl: thumbnailUrl }
                : s
            )
          );
        })
        .catch((err: Error) => {
          setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, status: "error", error: err.message } : s)));
        })
        .finally(() => xhrRefs.current.delete(id));
    }
  }

  function retryUpload(slot: ImageSlot) {
    // The original File object isn't retained once a slot errors out (only the
    // Blob preview URL is) — simplest correct retry is asking the owner to
    // remove the failed slot and re-pick that photo from the file input.
    removeSlot(slot);
  }

  function removeSlot(slot: ImageSlot) {
    if (slot.status === "uploading") {
      xhrRefs.current.get(slot.id)?.current?.abort();
    }
    if (slot.status === "done") {
      fetch(UPLOAD_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garmentId, imageId: slot.id }),
      }).catch(() => { /* best-effort cleanup; slot is removed locally regardless */ });
    }
    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
  }

  const canAddMore = slots.length < MAX_IMAGES;

  return (
    <section className="mb-10" aria-label="Garment images">
      <label className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider block">
        Photos
      </label>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
        Up to {MAX_IMAGES} photos. Drag to reorder — the first photo is the cover image.
      </p>

      {canAddMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="border border-dashed border-outline-variant bg-surface-container-lowest h-32 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          aria-label="Add photos"
        >
          <span className="material-symbols-outlined text-outline mb-2 text-3xl" aria-hidden="true">photo_camera</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Add photos — up to {MAX_IMAGES - slots.length} more
          </p>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFilesSelected}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {slots.length > 0 && (
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2 snap-x" role="list" aria-label="Selected images">
          {slots.map((slot, i) => (
            <div
              key={slot.id}
              ref={setItemRef(slot.id)}
              role="listitem"
              onPointerDown={slot.status === "done" ? (e) => handlePointerDown(e, slot.id) : undefined}
              onPointerMove={handlePointerMove}
              onPointerUp={finishDrag}
              onPointerCancel={finishDrag}
              style={{ touchAction: slot.status === "done" ? "none" : undefined }}
              className={`relative w-24 h-24 shrink-0 snap-start bg-surface-container-lowest border border-outline-variant flex items-center justify-center rounded group overflow-hidden select-none ${
                slot.status === "done" ? "cursor-grab active:cursor-grabbing" : ""
              } ${dragId === slot.id ? "opacity-50" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slot.previewUrl} alt={i === 0 ? "Cover image" : `Image ${i + 1}`} className="w-full h-full object-cover" />

              {slot.status === "uploading" && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 text-white">
                  <span className="font-label-md text-label-md">{slot.progress}%</span>
                  <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white transition-all" style={{ width: `${slot.progress}%` }} />
                  </div>
                </div>
              )}

              {slot.status === "error" && (
                <div className="absolute inset-0 bg-error/90 flex flex-col items-center justify-center gap-1 p-1 text-center">
                  <span className="material-symbols-outlined text-white text-lg" aria-hidden="true">error</span>
                  <button
                    type="button"
                    onClick={() => retryUpload(slot)}
                    className="font-label-md text-[10px] text-white underline"
                  >
                    Remove &amp; retry
                  </button>
                </div>
              )}

              {slot.status !== "uploading" && (
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => removeSlot(slot)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                >
                  <span className="material-symbols-outlined text-xs" aria-hidden="true">close</span>
                </button>
              )}

              {i === 0 && slot.status === "done" && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-surface-container text-on-surface font-label-md text-[10px] px-2 py-0.5 border border-outline-variant tracking-wider uppercase whitespace-nowrap">
                  Cover
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submitted with the form, in display order — only fully-uploaded images count */}
      {slots
        .filter((s) => s.status === "done")
        .map((s) => (
          <span key={s.id}>
            <input type="hidden" name="image_ids" value={s.id} />
            <input type="hidden" name="image_urls" value={s.url} />
            <input type="hidden" name="image_thumbnail_urls" value={s.thumbnailUrl} />
          </span>
        ))}
    </section>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import type { GarmentImage } from "@/lib/supabase/types";
import { defaultImageAlt } from "@/lib/utils/format";

interface GarmentImageCarouselProps {
  images: GarmentImage[];
  garmentTitle: string;
  categoryName?: string | null;
}

export default function GarmentImageCarousel({
  images,
  garmentTitle,
  categoryName,
}: GarmentImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full max-w-[440px] mx-auto aspect-[3/4] max-h-[550px] bg-surface-container rounded-sm border border-outline-variant flex flex-col items-center justify-center gap-2 text-outline p-6">
        <span className="material-symbols-outlined text-4xl">image</span>
        <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">No images uploaded</span>
      </div>
    );
  }

  const img = images[current];

  return (
    <section
      aria-label="Garment images"
      className="w-full max-w-[480px] mx-auto relative aspect-[3/4] max-h-[600px] overflow-hidden rounded-sm border border-outline-variant bg-surface-container-lowest shadow-xs"
    >
      <Image
        src={img.url}
        alt={img.alt_text ?? defaultImageAlt(garmentTitle, categoryName)}
        fill
        className="object-cover"
        priority={current === 0}
        sizes="(max-width: 768px) 90vw, 480px"
      />

      {/* Dot indicators */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 w-full flex justify-center gap-2 z-10"
          role="tablist"
          aria-label="Image selection"
        >
          {images.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`Image ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary ${
                i === current ? "bg-primary scale-110" : "bg-outline-variant/80 hover:bg-outline"
              }`}
            />
          ))}
        </div>
      )}

      {/* Swipe / tap zones */}
      {current > 0 && (
        <button
          aria-label="Previous image"
          onClick={() => setCurrent((c) => c - 1)}
          className="absolute left-0 top-0 h-full w-1/3 focus-visible:outline-none cursor-pointer"
        />
      )}
      {current < images.length - 1 && (
        <button
          aria-label="Next image"
          onClick={() => setCurrent((c) => c + 1)}
          className="absolute right-0 top-0 h-full w-1/3 focus-visible:outline-none cursor-pointer"
        />
      )}
    </section>
  );
}

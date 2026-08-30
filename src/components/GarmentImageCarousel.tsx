"use client";

import { useState } from "react";
import Image from "next/image";
import type { GarmentImage } from "@/lib/supabase/types";

interface GarmentImageCarouselProps {
  images: GarmentImage[];
  garmentTitle: string;
}

export default function GarmentImageCarousel({
  images,
  garmentTitle,
}: GarmentImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-surface-container rounded-sm border border-outline-variant flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-5xl">image</span>
      </div>
    );
  }

  const img = images[current];

  return (
    <section
      aria-label="Garment images"
      className="w-full relative aspect-[3/4] overflow-hidden rounded-sm border border-outline-variant bg-surface-container-lowest"
    >
      <Image
        src={img.url}
        alt={img.alt_text ?? `${garmentTitle} — image ${current + 1}`}
        fill
        className="object-cover"
        priority={current === 0}
        sizes="(max-width: 768px) 100vw, 50vw"
      />

      {/* Dot indicators */}
      {images.length > 1 && (
        <div
          className="absolute bottom-4 w-full flex justify-center gap-2"
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
              className={`w-2 h-2 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-on-primary ${
                i === current ? "bg-primary" : "bg-outline-variant"
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
          className="absolute left-0 top-0 h-full w-1/3 focus-visible:outline-none"
        />
      )}
      {current < images.length - 1 && (
        <button
          aria-label="Next image"
          onClick={() => setCurrent((c) => c + 1)}
          className="absolute right-0 top-0 h-full w-1/3 focus-visible:outline-none"
        />
      )}
    </section>
  );
}

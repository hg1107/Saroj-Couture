/**
 * next/image loader (wired up via images.loaderFile in next.config.ts).
 *
 * Photos are pre-rendered at upload time into thumb / medium / large WebP files
 * (lib/utils/image-processing.ts), so instead of Next re-encoding them on the
 * fly (at lower quality), this just points each srcset width at the smallest
 * pre-rendered file that still covers it.
 */
const MEDIA_RE = /^(\/media\/.+\/)(thumb|medium|large)\.webp$/;

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const match = MEDIA_RE.exec(src);
  if (!match) return src;
  const variant = width <= 600 ? "thumb" : width <= 1350 ? "medium" : "large";
  return `${match[1]}${variant}.webp`;
}

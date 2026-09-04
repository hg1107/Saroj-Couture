"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center gap-5 px-margin-mobile pt-[4.5rem] pb-20 md:pb-section-gap min-h-[70vh]">
      <span className="font-label-md text-xs text-secondary uppercase tracking-widest font-medium">
        Something went wrong
      </span>
      <h1 className="font-serif text-3xl md:text-4xl text-primary">
        We hit a snag
      </h1>
      <p className="font-sans text-sm md:text-base text-on-surface-variant max-w-md">
        Please try again, or head back to the homepage.
      </p>
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        <button
          onClick={reset}
          className="bg-secondary text-on-secondary px-6 py-3 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:opacity-90 transition-opacity font-medium cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="border border-outline-variant text-primary px-6 py-3 rounded-xs font-label-lg text-xs uppercase tracking-widest hover:bg-surface-container transition-colors font-medium"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}

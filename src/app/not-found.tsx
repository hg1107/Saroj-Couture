import Link from "next/link";

// Custom 404 page — Phase 2 will add proper styling.
export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
      <h1 className="font-serif text-4xl text-on-surface">404</h1>
      <p className="font-sans text-on-surface-variant">
        This page doesn&apos;t exist.
      </p>
      <Link href="/" className="text-secondary underline">
        Return home
      </Link>
    </main>
  );
}

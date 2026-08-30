// Public category gallery page — /category/[slug]
// Phase 4 will replace this with the real garment grid.
interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <p className="font-serif text-2xl text-on-surface-variant">
        Coming soon — Category: {slug}
      </p>
    </main>
  );
}

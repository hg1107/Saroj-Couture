// Public garment detail page — /garment/[slug]
// Phase 4 will replace this with the real garment detail UI.
interface Props {
  params: Promise<{ slug: string }>;
}

export default async function GarmentPage({ params }: Props) {
  const { slug } = await params;
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <p className="font-serif text-2xl text-on-surface-variant">
        Coming soon — Garment: {slug}
      </p>
    </main>
  );
}

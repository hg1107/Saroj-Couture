// Edit garment — /admin/garments/[id]/edit
// Phase 3 will add the pre-populated GarmentForm.
interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditGarmentPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="p-6">
      <h1 className="font-serif text-2xl text-on-surface mb-4">Edit Garment</h1>
      <p className="text-on-surface-variant">Coming soon — Edit garment {id}</p>
    </main>
  );
}

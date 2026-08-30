import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

// The edit form lives at /admin/garments/[id]/edit — this bare path just
// forwards there so any older link (e.g. a bookmark) still works.
export default async function GarmentRedirectPage({ params }: Props) {
  const { id } = await params;
  redirect(`/admin/garments/${id}/edit`);
}

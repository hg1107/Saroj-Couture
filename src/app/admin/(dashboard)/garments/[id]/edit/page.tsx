import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllCategoriesAdmin } from "@/lib/queries/categories";
import { getGarmentByIdAdmin } from "@/lib/queries/garments";
import GarmentFormClient from "@/components/admin/GarmentFormClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const garment = await getGarmentByIdAdmin(id);
  return { title: garment ? `Edit ${garment.title} | Admin` : "Edit Garment | Admin" };
}

export default async function EditGarmentPage({ params }: Props) {
  const { id } = await params;

  const [garment, categories] = await Promise.all([
    getGarmentByIdAdmin(id),
    getAllCategoriesAdmin(),
  ]);

  if (!garment) notFound();

  return <GarmentFormClient categories={categories} garment={garment} />;
}

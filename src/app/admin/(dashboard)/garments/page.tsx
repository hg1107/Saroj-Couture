import { getAllGarmentsAdmin } from "@/lib/queries/garments";
import { getAllCategoriesAdmin } from "@/lib/queries/categories";
import GarmentListClient from "@/components/admin/GarmentListClient";

export const metadata = { title: "Garments | Admin — Saroj Couture" };

export default async function AdminGarmentsPage() {
  const [garments, categories] = await Promise.all([
    getAllGarmentsAdmin(),
    getAllCategoriesAdmin(),
  ]);

  return (
    <GarmentListClient
      initialGarments={garments}
      categories={categories}
    />
  );
}

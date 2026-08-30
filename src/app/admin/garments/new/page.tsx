import { getAllCategoriesAdmin } from "@/lib/queries/categories";
import GarmentFormClient from "@/components/admin/GarmentFormClient";

export const metadata = { title: "Add Garment | Admin — Saroj Couture" };

export default async function NewGarmentPage() {
  const categories = await getAllCategoriesAdmin();
  return <GarmentFormClient categories={categories} />;
}

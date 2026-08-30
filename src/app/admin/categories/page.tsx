import { getAllCategoriesAdmin, getCategoryGarmentCounts } from "@/lib/queries/categories";
import CategoryListClient from "@/components/admin/CategoryListClient";

export const metadata = { title: "Categories | Admin — Saroj Couture" };

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([
    getAllCategoriesAdmin(),
    getCategoryGarmentCounts(),
  ]);

  return <CategoryListClient categories={categories} garmentCounts={counts} />;
}

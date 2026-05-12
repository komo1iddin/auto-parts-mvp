import { CategoriesList } from "@/components/categories/CategoriesList";
import { getCategoriesList } from "@/lib/data";

export default async function CategoriesPage() {
  const categories = await getCategoriesList();

  return <CategoriesList categories={categories} />;
}

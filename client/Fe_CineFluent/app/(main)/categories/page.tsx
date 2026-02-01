import { SSR_Categories } from "@/app/lib/data/categories";
import AllCategories from "@/app/components/all_categories";

export default async function CategoriesPage() {
  const { categories, pagination } = await SSR_Categories(1, 12); // Fetch more items for the full page
  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <AllCategories categories={categories} pagination={pagination} />
    </div>
  );
}

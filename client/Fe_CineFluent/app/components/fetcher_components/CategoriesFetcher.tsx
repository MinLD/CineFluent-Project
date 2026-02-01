import { SSR_Categories } from "@/app/lib/data/categories";
import Categiries_Skill_Top from "@/app/components/category_skill_top";

export default async function CategoriesFetcher() {
  const { categories } = await SSR_Categories(1, 4);
  return <Categiries_Skill_Top categories={categories} />;
}

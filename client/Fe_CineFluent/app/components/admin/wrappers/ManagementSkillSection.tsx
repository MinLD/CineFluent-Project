import BackButton from "@/app/components/back_button";
import { SkeletonManagers } from "@/app/components/skeleton_managers";
import SkillManagement from "@/app/components/admin/admin_details_categories";
import {
  SSR_All_SkillsByCategories,
  SSR_Categories,
} from "@/app/lib/data/categories";
import { Suspense } from "react";

async function ManagementSkillSection(params: {
  categoryId?: string;
  nameCategory?: string;
}) {
  const { skills, pagination } = await SSR_All_SkillsByCategories( 
    params.categoryId || "",
    1,
    3
  );
  const categories = await SSR_Categories();
  const data_skills = { skills, pagination };
  return (
    <>
      <div className="container mx-auto py-2 ">
        <BackButton nameCategory={params.nameCategory || ""} />
        <h1 className="text-3xl font-bold text-gray-800 mb-6 sm:text-center">
          Quản lý kỹ năng
        </h1>
        <Suspense fallback={<SkeletonManagers />}>
          <SkillManagement
            data_skills={data_skills}
            category_id={params.categoryId || ""}
            data_categories={categories}
          />
        </Suspense>
      </div>
    </>
  );
}
export default ManagementSkillSection;

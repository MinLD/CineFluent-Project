import BackButton from "@/app/components/back_button";
import { SkeletonManagers } from "@/app/components/skeleton_managers";
import VideoManagement from "@/app/components/admin/admin_details_categories";
import {
  SSR_All_VideosByCategories,
  SSR_Categories,
} from "@/app/lib/data/categories";
import { Suspense } from "react";

async function ManagementVideoSection(params: {
  categoryId?: string;
  nameCategory?: string;
}) {
  const { videos, pagination } = await SSR_All_VideosByCategories(
    params.categoryId || "",
    1,
    5,
  );
  const categories = await SSR_Categories();
  const data_videos = { videos, pagination };
  return (
    <>
      <div className="container mx-auto py-2 ">
        <BackButton nameCategory={params.nameCategory || ""} />
        <h1 className="text-3xl font-bold text-gray-800 mb-6 sm:text-center">
          Quản lý Phim
        </h1>
        <Suspense fallback={<SkeletonManagers />}>
          <VideoManagement
            data_videos={data_videos}
            category_id={params.categoryId || ""}
            data_categories={categories}
          />
        </Suspense>
      </div>
    </>
  );
}
export default ManagementVideoSection;

import { SkeletonManagers } from "@/app/components/skeleton_managers";
import Videos_Management from "@/app/components/admin/videos_management";
import { SSR_Categories } from "@/app/lib/data/categories";
import { SSR_All_Videos } from "@/app/lib/data/videos";
import { Suspense } from "react";

async function VideosSection() {
  const { videos, pagination } = await SSR_All_Videos(1, 10, "all");
  const categories = await SSR_Categories(1, 100); // Fetch more categories for filter dropdown

  const data_videos = { videos: videos || [], pagination };
  const data_categories = { categories: categories.categories || [] };

  return (
    <div className="container mx-auto py-2">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản trị Phim</h1>
      <Suspense fallback={<SkeletonManagers />}>
        <Videos_Management
          data_videos={data_videos as any}
          data_categories={data_categories as any}
        />
      </Suspense>
    </div>
  );
}

export default VideosSection;

import { VideoListSkeleton } from "@/app/components/movies/skeletons/VideoListSkeleton";
import { SSR_Categories } from "@/app/lib/data/categories";
import MoviePage from "@/app/components/movies/movie_page";
import VideoFetcher from "@/app/components/fetcher_components/videoFetcher";
import { Suspense } from "react";
export const dynamic = "force-dynamic";

import { BannerSkeleton } from "@/app/components/movies/skeletons/BannerSkeleton";

export default async function page() {
  // Fetch only categories - videos will be fetched by VideoFetcher
  const categories = await SSR_Categories(1, 10000);
  const topCategoryId = 22;
  const hotCategoryId = 23;

  return (
    <MoviePage
      categories={categories}
      bannerSlot={
        <Suspense fallback={<BannerSkeleton />}>
          <VideoFetcher
            source_type="local"
            categoryId={hotCategoryId}
            isBanner={true}
          />
        </Suspense>
      }
      youtubeSlot={
        <Suspense fallback={<VideoListSkeleton />}>
          <VideoFetcher source_type="youtube" />
        </Suspense>
      }
      localSlot={
        <Suspense fallback={<VideoListSkeleton />}>
          <VideoFetcher source_type="local" />
        </Suspense>
      }
      top5Slot={
        <Suspense fallback={<VideoListSkeleton isRanked={true} />}>
          <VideoFetcher
            source_type="local"
            isRanked={true}
            categoryId={topCategoryId}
          />
        </Suspense>
      }
    />
  );
}

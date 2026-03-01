import { VideoList } from "@/app/components/movies/VideoList";
import BannerCarousel from "@/app/components/movies/BannerCarousel";
import { SSR_Video_All } from "@/app/lib/data/video";

export default async function VideoFetcher({
  source_type,
  isRanked = false,
  categoryId,
  releaseYear,
  isBanner = false,
}: {
  source_type?: string;
  isRanked?: boolean;
  categoryId?: string | number;
  releaseYear?: string | number;
  isBanner?: boolean;
}) {
  const videosData = await SSR_Video_All(source_type, categoryId);
  if (!videosData || !videosData.videos) {
    return (
      <VideoList
        initialVideos={[]}
        source_type={source_type}
        isRanked={isRanked}
        categoryId={categoryId}
        releaseYear={releaseYear}
      />
    );
  }

  const videos = videosData.videos.videos || [];

  if (isBanner) {
    return <BannerCarousel initialBanners={videos} />;
  }

  return (
    <VideoList
      initialVideos={videos}
      source_type={source_type}
      isRanked={isRanked}
      categoryId={categoryId}
      releaseYear={releaseYear}
    />
  );
}

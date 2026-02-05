import { VideoList } from "@/app/components/movies/VideoList";
import { SSR_Video_All } from "@/app/lib/data/video";

export default async function VideoFetcher() {
  const videosData = await SSR_Video_All();
  return <VideoList initialVideos={videosData.videos.videos} />;
}

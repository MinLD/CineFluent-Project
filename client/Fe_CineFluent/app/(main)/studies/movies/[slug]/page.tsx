import { VideoPlayerWrapper } from "@/app/components/movies/VideoPlayerWrapper";
import { VideoInfo } from "@/app/components/movies/VideoInfo";
import { SSR_Video_Slug } from "@/app/lib/data/video";

import { notFound } from "next/navigation";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const video = await SSR_Video_Slug(slug);

  if (!video) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Video Player with Synced Subtitles */}
        <VideoPlayerWrapper video={video} />

        {/* Video Info */}
        <div className="mt-6">
          <VideoInfo video={video} />
        </div>
      </div>
    </div>
  );
}

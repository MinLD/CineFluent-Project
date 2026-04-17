import { MovieAIAnalysisCard } from "@/app/components/movies/MovieAIAnalysisCard";
import { VideoPlayerWrapper } from "@/app/components/movies/VideoPlayerWrapper";
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
    <>
      <div className="bg-slate-900">
        <VideoPlayerWrapper video={video} />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <MovieAIAnalysisCard analysis={video.ai_analysis ?? null} />
        </div>
      </div>
    </>
  );
}

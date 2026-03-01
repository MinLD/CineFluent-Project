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
      <div className="bg-slate-900 min-h-screen mb-50 sm:mb-0">
        <VideoPlayerWrapper video={video} />
      </div>
    </>
  );
}

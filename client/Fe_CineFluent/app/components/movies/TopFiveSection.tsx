"use client";

import { I_Video } from "@/app/lib/types/video";
import { TopMovieCard } from "./TopMovieCard";

interface TopFiveSectionProps {
  videos: I_Video[];
}

export function TopFiveSection({ videos }: TopFiveSectionProps) {
  // Lấy 5 phim đầu tiên
  const topVideos = videos.slice(0, 5);

  if (topVideos.length === 0) return null;

  return (
    <section className="mb-16">
      {/* Grid danh sách */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 pl-4 items-end">
        {topVideos.map((video, index) => (
          <TopMovieCard key={video.id} video={video} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}

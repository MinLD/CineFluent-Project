"use client";

import { MovieCardSkeleton } from "@/app/components/movies/skeletons/MovieCardSkeleton";
import { TopMovieSkeleton } from "@/app/components/movies/skeletons/TopMovieSkeleton";

interface VideoListSkeletonProps {
  isRanked?: boolean;
}

export function VideoListSkeleton({
  isRanked = false,
}: VideoListSkeletonProps) {
  return (
    <div className={`w-full overflow-hidden pb-4 pt-2`}>
      <div className="flex gap-4 sm:gap-5 w-full">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className={
              isRanked
                ? "w-[260px] sm:w-[320px] flex-shrink-0"
                : "w-[280px] flex-shrink-0"
            }
          >
            {isRanked ? (
              <TopMovieSkeleton rank={index + 1} />
            ) : (
              <MovieCardSkeleton />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

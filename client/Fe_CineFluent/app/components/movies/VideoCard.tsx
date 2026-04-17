"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { I_Video } from "@/app/lib/types/video";
import { MovieDifficultyBadge } from "@/app/components/movies/MovieDifficultyBadge";

interface VideoCardProps {
  video: I_Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const image_url = video.backdrop_url
    ? video.backdrop_url
    : video.thumbnail_url;
  return (
    <Link href={`/studies/movies/${video.slug}`}>
      <div className="flex-shrink-0 w-[280px] group relative overflow-hidden rounded-lg transition-all duration-300 cursor-pointer">
        {/* Thumbnail */}
        <div className="rounded-2xl relative aspect-video overflow-hidden bg-slate-900">
          {image_url ? (
            <Image
              src={image_url}
              alt={video.title}
              fill
              className=" object-cover group-hover:scale-110 hover:blur-sm transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-16 h-16 text-slate-600" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>

          {/* Source Badge */}
          <div className="absolute top-2 right-2">
            <span className="text-white text-[12px] font-semibold">HD</span>
          </div>

          {/* Progress Bar */}
          {video.user_history &&
            video.user_history.last_position &&
            video.user_history.duration && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      (video.user_history.last_position /
                        video.user_history.duration) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            )}
        </div>

        {/* Info */}
        <div className="mt-5">
          <div>
            <h3 className="text-[18px] text-white font-semibold line-clamp-1 mb-2 group-hover:text-blue-400 transition">
              {video.original_title}
            </h3>
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] text-gray-400 font-semibold line-clamp-1 mb-2 ">
                {video.title}
              </h3>
              <h3 className="text-[12px] text-gray-400 font-semibold line-clamp-1 mb-2 ">
                {video.release_year}
              </h3>
            </div>
            {video.ai_analysis && video.ai_analysis.status !== "FAILED" && (
              <div className="mt-1">
                <MovieDifficultyBadge analysis={video.ai_analysis} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

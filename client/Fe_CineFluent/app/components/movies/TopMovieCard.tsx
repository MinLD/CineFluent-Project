"use client";

import Image from "next/image";
import Link from "next/link";
import { I_Video } from "@/app/lib/types/video";

interface TopMovieCardProps {
  video: I_Video;
  rank: number;
}

export function TopMovieCard({ video, rank }: TopMovieCardProps) {
  return (
    <Link
      href={`/studies/movies/${video.slug}`}
      className="group relative block w-full max-w-[280px] sm:max-w-[320px] md:max-w-full"
    >
      <div className="relative flex items-end">
        {/* Số thứ tự lớn */}
        <div className="absolute -left-4 bottom-0 z-10 select-none">
          <span
            className="text-[120px] font-black leading-none text-transparent stroke-white"
            style={{
              WebkitTextStroke: "2px rgba(255,255,255,0.8)",
              textShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {rank}
          </span>
        </div>

        {/* Poster Phim */}
        <div className="relative ml-8 w-full aspect-[2/3] overflow-hidden rounded-xl bg-slate-900 shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2 group-hover:shadow-blue-500/20">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.original_title || video.title}
              fill
              className="object-cover transition-all duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
              No Poster
            </div>
          )}

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />

          {/* Title Info trên Poster */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <h3 className="text-white font-bold text-sm line-clamp-2 md:text-base mb-1 group-hover:text-blue-400 transition-colors">
              {video.original_title}
            </h3>
            <p className="text-gray-400 text-xs line-clamp-1 italic">
              {video.title}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

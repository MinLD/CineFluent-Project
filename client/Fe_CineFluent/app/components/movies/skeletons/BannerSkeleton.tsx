"use client";

import { ImageIcon } from "lucide-react";

export function BannerSkeleton() {
  return (
    <div className="relative w-full h-[65vh] md:h-[85vh] min-h-[500px] bg-slate-900 animate-pulse overflow-hidden">
      {/* Background Skeleton */}
      <div className="absolute inset-0 bg-slate-800" />

      <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center mb-16 md:mb-0">
        <div className="max-w-2xl space-y-4 md:space-y-6 pt-10 md:pt-20 w-full">
          {/* Title Skeleton */}
          <div className="space-y-3">
            <div className="h-10 md:h-16 bg-slate-700/50 rounded-lg w-3/4" />
            <div className="h-6 md:h-8 bg-slate-700/50 rounded-lg w-1/2" />
          </div>

          {/* Metadata Skeleton */}
          <div className="flex items-center gap-2 md:gap-4 pt-2">
            <div className="h-6 w-16 bg-slate-700/50 rounded" />
            <div className="h-6 w-12 bg-slate-700/50 rounded" />
            <div className="h-6 w-16 bg-slate-700/50 rounded" />
            <div className="h-6 w-12 bg-slate-700/50 rounded" />
          </div>

          {/* Description Skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-slate-700/50 rounded w-full" />
            <div className="h-4 bg-slate-700/50 rounded w-5/6" />
            <div className="h-4 bg-slate-700/50 rounded w-4/6" />
          </div>

          {/* Buttons Skeleton */}
          <div className="flex items-center gap-3 md:gap-4 pt-4 md:pt-6">
            <div className="h-10 md:h-12 w-32 md:w-40 bg-slate-700/50 rounded-full" />
            <div className="h-10 md:h-12 w-32 md:w-40 bg-slate-700/50 rounded-full" />
            <div className="h-10 md:h-12 w-32 md:w-40 bg-slate-700/50 rounded-full hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Thumbnails Sidebar Skeleton */}
      <div className="hidden lg:block absolute z-10 w-full bottom-4 left-0 px-4 lg:px-0 lg:right-10 lg:left-auto lg:bottom-24 lg:w-[600px]">
        <div className="flex gap-4 px-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex-1 aspect-video bg-slate-700/50 rounded-xl flex items-center justify-center"
            >
              <ImageIcon className="w-8 h-8 text-slate-500/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

export function MovieCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[280px] overflow-hidden rounded-lg bg-slate-800 border border-slate-700 animate-pulse">
      {/* Thumbnail Skeleton */}
      <div className="relative aspect-video bg-slate-700">
        <div className="absolute inset-0 bg-slate-600/20" />
      </div>

      {/* Info Skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-700 rounded w-1/2" />
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <div className="h-6 bg-slate-700 rounded-full w-16" />
          <div className="h-6 bg-slate-700 rounded-full w-20" />
        </div>

        {/* View Count */}
        <div className="h-4 bg-slate-700 rounded w-24" />
      </div>
    </div>
  );
}

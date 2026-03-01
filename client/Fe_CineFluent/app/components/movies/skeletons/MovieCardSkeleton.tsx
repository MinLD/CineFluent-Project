"use client";

export function MovieCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[280px] group relative overflow-hidden rounded-lg transition-all duration-300">
      {/* Thumbnail */}
      <div className="rounded-2xl relative aspect-video overflow-hidden bg-slate-800 animate-pulse border border-slate-700">
        <div className="absolute inset-0 bg-slate-700/20" />
      </div>

      {/* Info */}
      <div className="mt-5 space-y-3">
        {/* Title */}
        <div className="h-[18px] bg-slate-800 rounded w-3/4 animate-pulse border border-slate-700" />
        <div className="flex items-center justify-between">
          <div className="h-[12px] bg-slate-800 rounded w-1/3 animate-pulse border border-slate-700" />
          <div className="h-[12px] bg-slate-800 rounded w-1/4 animate-pulse border border-slate-700" />
        </div>
      </div>
    </div>
  );
}

"use client";

export function TopMovieSkeleton({ rank }: { rank: number }) {
  return (
    <div className="group relative block w-full max-w-[280px] sm:max-w-[320px] md:max-w-full">
      <div className="relative flex items-end">
        {/* Số thứ tự lớn */}
        <div className="absolute -left-4 bottom-0 z-10 select-none">
          <span
            className="text-[120px] font-black leading-none text-transparent stroke-slate-700 animate-pulse"
            style={{
              WebkitTextStroke: "2px rgba(51, 65, 85, 0.8)",
              textShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            {rank}
          </span>
        </div>

        {/* Poster Phim */}
        <div className="relative ml-8 w-full aspect-[2/3] overflow-hidden rounded-xl bg-slate-800 shadow-2xl animate-pulse border border-slate-700">
          <div className="absolute inset-0 bg-slate-700/20" />

          {/* Title Info trên Poster */}
          <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2">
            <div className="h-4 bg-slate-600 rounded w-3/4" />
            <div className="h-3 bg-slate-600 rounded w-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
}

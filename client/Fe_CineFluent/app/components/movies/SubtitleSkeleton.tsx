"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export function SubtitleSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
        >
          <div className="mb-2">
            <Skeleton
              baseColor="#1e293b"
              highlightColor="#334155"
              height={20}
              width="80%"
            />
          </div>
          <div className="mb-2">
            <Skeleton
              baseColor="#1e293b"
              highlightColor="#334155"
              height={16}
              width="60%"
            />
          </div>
          <div className="flex gap-2">
            <Skeleton
              baseColor="#1e293b"
              highlightColor="#334155"
              height={12}
              width={40}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

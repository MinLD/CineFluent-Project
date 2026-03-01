"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVideosAction } from "@/app/lib/actions/videos";
import { VideoCard } from "./VideoCard";
import { Loader2 } from "lucide-react";
import { I_Videos_Data } from "@/app/lib/types/video";

interface VideoGridProps {
  initialVideos: I_Videos_Data;
}

export function VideoGrid({ initialVideos }: VideoGridProps) {
  const [filters, setFilters] = useState({
    source_type: undefined,
    category_id: undefined,
    search: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["videos", filters],
    queryFn: () =>
      getVideosAction(
        1,
        12,
        filters.category_id,
        undefined,
        filters.source_type,
        undefined,
        filters.search,
      ),
    initialData: initialVideos,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const videos = data?.videos || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 text-lg">No videos found</p>
        <p className="text-slate-500 text-sm mt-2">
          Try adjusting your filters or import a new video
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video: any) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

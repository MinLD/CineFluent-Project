"use client";

import { VideoCard } from "@/app/components/movies/VideoCard";
import { useQuery } from "@tanstack/react-query";
import { getVideosAction } from "@/app/lib/actions/videos";
import { Loader2 } from "lucide-react";
import { I_Video } from "@/app/lib/types/video";

interface VideoListProps {
  initialVideos: I_Video[];
}

export function VideoList({ initialVideos }: VideoListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: () => getVideosAction(),
    initialData: { videos: initialVideos, total: initialVideos.length },
    staleTime: 0, // Always refetch when invalidated
  });

  const videos = data?.videos || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex-shrink-0 w-full text-center py-12">
        <p className="text-slate-400">Chưa có video nào</p>
        <p className="text-slate-500 text-sm mt-2">
          Hãy import video YouTube đầu tiên của bạn!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video: any) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </>
  );
}

"use client";

import { VideoCard } from "@/app/components/movies/VideoCard";
import { TopMovieCard } from "@/app/components/movies/TopMovieCard";
import { useQuery } from "@tanstack/react-query";
import { getVideosAction } from "@/app/lib/actions/videos";
import { Loader2 } from "lucide-react";
import { I_Video } from "@/app/lib/types/video";
import MySlider from "@/app/components/my_slide";
import { SwiperSlide } from "swiper/react";
import { useEffect, useState } from "react";
import { VideoListSkeleton } from "@/app/components/movies/skeletons/VideoListSkeleton";

interface VideoListProps {
  initialVideos: I_Video[];
  source_type?: string;
  isRanked?: boolean;
  categoryId?: string | number;
  releaseYear?: string | number;
}

export function VideoList({
  initialVideos,
  source_type,
  isRanked = false,
  categoryId,
  releaseYear,
}: VideoListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["videos", source_type, categoryId, releaseYear],
    queryFn: () => getVideosAction(1, 12, categoryId, releaseYear, source_type),
    initialData: {
      videos: initialVideos,
      pagination: {
        total_items: initialVideos.length,
        total_pages: 1,
        current_page: 1,
        per_page: 12,
      },
    },
    staleTime: 60 * 1000, // Keep data fresh for 1 minute
  });

  const videos = data?.videos || [];
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Tránh FOUC do SSR/Hydration Mismatch bằng cách hiện tĩnh bộ xương ngoài lúc sơ khởi
  if (isLoading || !isMounted) {
    return <VideoListSkeleton isRanked={isRanked} />;
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
      <div className={`w-full ${isRanked ? "" : ""}`}>
        <MySlider
          swiperOptions={{
            autoplay: false,
            loop: !isRanked,
            navigation: false,
            slidesPerView: 1.2,
            spaceBetween: 10,
          }}
          className="cursor-pointer"
        >
          {videos.map((video: any, index: number) => (
            <SwiperSlide key={video.id}>
              {isRanked ? (
                <TopMovieCard video={video} rank={index + 1} />
              ) : (
                <VideoCard video={video} />
              )}
            </SwiperSlide>
          ))}
        </MySlider>
      </div>
    </>
  );
}

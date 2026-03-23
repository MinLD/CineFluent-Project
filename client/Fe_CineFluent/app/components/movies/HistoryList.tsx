"use client";

import { VideoCard } from "@/app/components/movies/VideoCard";
import { PlatformSection } from "@/app/components/movies/PlatformSection";
import { History, Clock } from "lucide-react";
import MySlider from "@/app/components/my_slide";
import { SwiperSlide } from "swiper/react";
import { I_Video } from "@/app/lib/types/video";

export function HistoryList({ videos }: { videos: I_Video[] }) {
  if (!videos || videos.length === 0) return null;

  return (
    <PlatformSection
      title="Vừa xem gần đây"
      icon={<Clock className="w-6 h-6" />}
      description="Xem tiếp những nội dung bạn đang bỏ dở"
      iconColor="text-blue-400"
      accentColor="from-blue-400/20 to-cyan-500/20"
    >
      <div className="w-full">
        <MySlider
          swiperOptions={{
            autoplay: false,
            loop: false,
            navigation: false,
            slidesPerView: 1.2,
            spaceBetween: 10,
          }}
          className="cursor-pointer"
        >
          {videos.map((video) => (
            <SwiperSlide key={video.id}>
              <VideoCard video={video} />
            </SwiperSlide>
          ))}
        </MySlider>
      </div>
    </PlatformSection>
  );
}

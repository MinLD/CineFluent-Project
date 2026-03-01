"use client";

import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Navigation, Thumbs } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import Image from "next/image";
import { Play, Plus, Info, Star } from "lucide-react";
import Link from "next/link";
import { Swiper as SwiperType } from "swiper";
import { ExploreButton } from "@/app/components/movies/ExploreButton";
import { I_Video } from "@/app/lib/types/video";
import button from "antd/es/button";

export default function BannerCarousel({
  initialBanners = [],
}: {
  initialBanners: I_Video[];
}) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || initialBanners.length === 0) {
    // Trả về 1 khung tĩnh y hệt cấu trúc của Slider nhưng chỉ chứa ảnh đầu tiên
    const headItem = initialBanners[0] || {};
    return (
      <div className="relative w-full h-[65vh] md:h-[85vh] min-h-[500px] bg-black group banner-swiper flex items-center">
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={
              headItem.backdrop_url ||
              headItem.thumbnail_url ||
              "/images/placeholder.jpg"
            }
            alt={headItem.title || "Movie Background"}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[65vh] md:h-[85vh] min-h-[500px] bg-black group banner-swiper">
      {/* Main Slider */}
      <Swiper
        modules={[Autoplay, EffectFade, Thumbs]}
        effect="fade"
        speed={800}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        thumbs={{ swiper: thumbsSwiper }}
        loop={true}
        className="w-full h-full"
      >
        {initialBanners.map((item) => (
          <SwiperSlide key={item.id}>
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full  z-10">
              {/* Desktop Image */}
              <Image
                src={
                  item.backdrop_url ||
                  item.thumbnail_url ||
                  "/images/placeholder.jpg"
                }
                alt={item.title || "Movie Background"}
                fill
                className="object-cover hidden sm:block"
                priority
              />
              {/* Mobile Image */}
              <Image
                src={
                  item.thumbnail_url ||
                  item.backdrop_url ||
                  "/images/placeholder.jpg"
                }
                alt={item.title || "Movie Background"}
                fill
                className="object-cover block sm:hidden"
                priority
              />
              {/* Overlay Gradient (Cinema Effect) */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black/90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-20 w-full max-w-[1920px]  lg:bottom-0 mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center mb-16 lg:mb-0 ">
              <div className="max-w-2xl space-y-4 lg:space-y-6 pt-10 lg:pt-20">
                {/* Title */}
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-1 lg:mb-2 leading-tight drop-shadow-lg line-clamp-2">
                    {item.title}
                  </h1>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm font-medium text-gray-300">
                  <span className="border border-gray-600 px-1.5 lg:px-2 py-0.5 rounded">
                    {item.release_year || "2024"}
                  </span>
                  <span className="bg-white/20 px-1.5 lg:px-2 py-0.5 rounded text-white">
                    HD
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm lg:text-lg line-clamp-3 leading-relaxed drop-shadow-md max-w-xl">
                  {item.description || "Nội dung phim đang được cập nhật."}
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-3 lg:gap-4 pt-2 lg:pt-4">
                  <Link href={`/studies/movies/${item.slug}`}>
                    <button className="flex items-center gap-2 lg:gap-3 px-5 py-2.5 lg:px-8 lg:py-3.5 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-full transition-transform hover:scale-105 active:scale-95 text-sm lg:text-base">
                      <Play
                        fill="currentColor"
                        size={18}
                        className="lg:w-5 lg:h-5"
                      />
                      <span>Xem ngay</span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails Sidebar (Bottom Right - Horizontal) - Hidden on Mobile/Tablet */}
      <div className="hidden md:block absolute z-10 w-[350px] sm:w-[450px] bottom-20 md:bottom-20  px-0 right-3 left-auto lg:bottom-24 lg:w-[480px] xl:w-[800px]">
        <div className="px-2">
          <Swiper
            onSwiper={setThumbsSwiper}
            direction="horizontal"
            spaceBetween={10}
            slidesPerView={3.2}
            breakpoints={{
              640: {
                slidesPerView: 3.5,
                spaceBetween: 15,
              },
            }}
            modules={[Thumbs]}
            className="thumb-swiper py-2 md:py-4"
          >
            {initialBanners.map((item) => (
              <SwiperSlide
                key={item.id}
                className="cursor-pointer rounded-lg md:rounded-xl overflow-hidden opacity-60 hover:opacity-100 transition-all duration-300 !h-auto aspect-video border-2 border-transparent hover:border-white hover:scale-105 thumb-slide shadow-lg"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={
                      item.backdrop_url ||
                      item.thumbnail_url ||
                      "/images/placeholder.jpg"
                    }
                    alt={item.title || "Movie Background"}
                    fill
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Global Styles for Thumb Active State */}
      <style jsx global>{`
        .thumb-swiper .swiper-slide-thumb-active {
          opacity: 1 !important;
          border-color: white !important; /* blue-500 */
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(234, 179, 8, 0.4);
          z-index: 10;
        }
      `}</style>

      <div className="absolute inset-x-0 bottom-3 md:bottom-10 flex justify-center z-30 pointer-events-none">
        <div className="pointer-events-auto">
          <ExploreButton />
        </div>
      </div>
    </div>
  );
}

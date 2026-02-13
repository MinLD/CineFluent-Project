"use client";

import { useState } from "react";
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

// Mock Data (Sẽ thay bằng API sau)
const banners = [
  {
    id: 1,
    title: "Dune: Part Two",
    originalTitle: "Dune: Hành Tinh Cát 2",
    description:
      "Paul Atreides hợp nhất với Chani và người Fremen trên con đường trả thù những kẻ đã hủy diệt gia tộc của mình.",
    rating: 8.8,
    year: 2024,
    duration: "2h 46m",
    quality: "HD",
    image:
      "https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop:
      "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
  },
  {
    id: 2,
    title: "Kung Fu Panda 4",
    originalTitle: "Kung Fu Panda 4",
    description:
      "Po phải tìm kiếm và huấn luyện Chiến binh Rồng tiếp theo, trong khi một phù thủy độc ác lên kế hoạch triệu hồi lại tất cả những kẻ phản diện mà Po đã đánh bại.",
    rating: 7.6,
    year: 2024,
    duration: "1h 34m",
    quality: "FHD",
    image:
      "https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    backdrop:
      "https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg",
  },
  {
    id: 3,
    title: "Dune: Part Two",
    originalTitle: "Dune: Hành Tinh Cát 2",
    description:
      "Paul Atreides hợp nhất với Chani và người Fremen trên con đường trả thù những kẻ đã hủy diệt gia tộc của mình.",
    rating: 8.8,
    year: 2024,
    duration: "2h 46m",
    quality: "HD",
    image:
      "https://image.tmdb.org/t/p/original/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop:
      "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
  },
  {
    id: 4,
    title: "Kung Fu Panda 4",
    originalTitle: "Kung Fu Panda 4",
    description:
      "Po phải tìm kiếm và huấn luyện Chiến binh Rồng tiếp theo, trong khi một phù thủy độc ác lên kế hoạch triệu hồi lại tất cả những kẻ phản diện mà Po đã đánh bại.",
    rating: 7.6,
    year: 2024,
    duration: "1h 34m",
    quality: "FHD",
    image:
      "https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    backdrop:
      "https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg",
  },
];

export default function BannerCarousel() {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

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
        {banners.map((item) => (
          <SwiperSlide key={item.id}>
            {/* Background Image */}
            <div className="absolute inset-0 w-full h-full">
              <Image
                src={item.backdrop}
                alt={item.title}
                fill
                className="object-cover"
                priority
              />
              {/* Overlay Gradient (Cinema Effect) */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:from-black/90" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center mb-16 md:mb-0">
              <div className="max-w-2xl space-y-4 md:space-y-6 pt-10 md:pt-20">
                {/* Title */}
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-1 md:mb-2 leading-tight drop-shadow-lg line-clamp-2">
                    {item.title}
                  </h1>
                  <p className="text-sm md:text-xl text-blue-500 font-medium italic drop-shadow-md truncate">
                    {item.originalTitle}
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-1 bg-blue-400 text-black px-1.5 py-0.5 md:px-2 rounded font-bold">
                    <span className="text-[10px] md:text-xs">IMDb</span>
                    <span>{item.rating}</span>
                  </div>
                  <span className="border border-gray-600 px-1.5 md:px-2 py-0.5 rounded">
                    {item.year}
                  </span>
                  <span className="border border-gray-600 px-1.5 md:px-2 py-0.5 rounded">
                    {item.duration}
                  </span>
                  <span className="bg-white/20 px-1.5 md:px-2 py-0.5 rounded text-white">
                    {item.quality}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm md:text-lg line-clamp-3 leading-relaxed drop-shadow-md max-w-xl">
                  {item.description}
                </p>

                {/* Buttons */}
                <div className="flex items-center gap-3 md:gap-4 pt-2 md:pt-4">
                  <button className="flex items-center gap-2 md:gap-3 px-5 py-2.5 md:px-8 md:py-3.5 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-full transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.5)] text-sm md:text-base">
                    <Play
                      fill="currentColor"
                      size={18}
                      className="md:w-5 md:h-5"
                    />
                    <span>Xem ngay</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm border border-white/10 transition-colors text-sm md:text-base">
                    <Plus size={18} className="md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Danh sách</span>
                    <span className="sm:hidden">Lưu</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2.5 md:px-6 md:py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm border border-white/10 transition-colors text-sm md:text-base">
                    <Info size={18} className="md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Chi tiết</span>
                  </button>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails Sidebar (Bottom Right - Horizontal) */}
      <div className="absolute z-10 w-full bottom-4 left-0 px-4 lg:px-0 lg:right-10 lg:left-auto lg:bottom-24 lg:w-[600px]">
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
            {banners.map((item) => (
              <SwiperSlide
                key={item.id}
                className="cursor-pointer rounded-lg md:rounded-xl overflow-hidden opacity-60 hover:opacity-100 transition-all duration-300 !h-auto aspect-video border-2 border-transparent hover:border-white hover:scale-105 thumb-slide shadow-lg"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={item.backdrop}
                    alt={item.title}
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

      <div className="absolute inset-0 bottom-10 flex items-end justify-center z-10">
        <ExploreButton />
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Swiper } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

// Import kiểu dữ liệu của các tùy chọn Swiper để có type-safety
import type { SwiperOptions } from "swiper/types";

// Định nghĩa Props cho component
type Props = {
  children: React.ReactNode;

  className?: string;

  swiperOptions?: SwiperOptions;
};

function MySlider({ children, className, swiperOptions }: Props) {
  const defaultOptions: SwiperOptions = {
    modules: [Navigation, Pagination, Autoplay],
    loop: true,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    pagination: {
      clickable: true,
    },
    navigation: true,
    slidesPerView: 1,
    spaceBetween: 10,
    breakpoints: {
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      768: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
      1024: {
        slidesPerView: 4,
        spaceBetween: 30,
      },
    },
  };

  return (
    <div
      className={`container mx-auto py-8 ${className}`}
      suppressHydrationWarning
    >
      <Swiper
        {...defaultOptions}
        {...swiperOptions}
        className="rounded-lg pb-4"
      >
        {children}
      </Swiper>
    </div>
  );
}

export default MySlider;

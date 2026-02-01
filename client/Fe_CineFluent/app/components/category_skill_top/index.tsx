"use client";

import { useRouter } from "next/navigation";
import { fadeInUp, staggerContainer } from "@/app/lib/Animation";
import { motion } from "framer-motion";
import { I_category } from "@/app/lib/types/categories";
import CardCategories from "../card_categories";
import MySlider from "@/app/components/my_slide";
import { SwiperSlide } from "swiper/react";
import { ChevronDown, ArrowRight } from "lucide-react";

type prop = {
  categories?: I_category[];
};

const Categiries_Skill_Top = ({ categories = [] }: prop) => {
  const router = useRouter();

  const handleSeeAll = () => {
    router.push("/categories");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="flex justify-center flex-col items-center space-y-3 mb-10"
      >
        <motion.h2
          variants={fadeInUp}
          className="text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl"
        >
          Kỹ năng phổ biến
        </motion.h2>

        <motion.p
          variants={fadeInUp}
          className="mt-2 text-md text-gray-500 md:text-lg"
        >
          Khám phá các kỹ năng được nhiều người dùng quan tâm và trao đổi
        </motion.p>
      </motion.div>

      {/* Mobile View: Slider */}
      <div className="block md:hidden">
        <MySlider
          swiperOptions={{
            autoplay: false,
            navigation: false,
            slidesPerView: 1.2,
            spaceBetween: 10,
          }}
          className="cursor-pointer"
        >
          {categories.slice(0, 5).map((cate, index) => (
            <SwiperSlide key={`${cate.id}-mobile-${index}`}>
              <CardCategories categories={cate} />
            </SwiperSlide>
          ))}
          <SwiperSlide>
            <div
              onClick={handleSeeAll}
              className="group h-auto bg-white/50 border-2 border-dashed border-gray-300 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 min-h-[252px]"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ChevronDown className="w-8 h-8 text-gray-400 group-hover:text-blue-600 -rotate-90 ml-1" />
              </div>
              <p className="font-semibold text-gray-600 group-hover:text-blue-700 text-lg">
                Xem tất cả
              </p>
            </div>
          </SwiperSlide>
        </MySlider>
      </div>

      {/* Grid View: Desktop */}
      <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((cate, index) => (
          <motion.div
            key={`${cate.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            viewport={{ once: true }}
          >
            <CardCategories categories={cate} />
          </motion.div>
        ))}
      </div>

      {/* See All Button - Desktop */}
      <div className="mt-10 hidden md:flex justify-center">
        <button
          onClick={handleSeeAll}
          className="group px-8 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-full shadow-sm hover:shadow-md hover:border-blue-400 hover:text-blue-600 transition-all duration-300 flex items-center gap-2"
        >
          Xem tất cả
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
};

export default Categiries_Skill_Top;

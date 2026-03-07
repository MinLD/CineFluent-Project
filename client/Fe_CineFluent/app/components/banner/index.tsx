"use client";
import { GraduationCap, SquarePlay } from "lucide-react";
import banner from "@/public/img/banner8.png";
import Link from "next/link";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import Image from "next/image";

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};

const Banner = () => {
  return (
    <section className="relative h-auto bg-black  text-white overflow-hidden">
      {/* ảnh banner */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${banner.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-10 mb-12">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8  items-center">
          {/* 1. Tiêu đề và Mô tả (Luôn đứng đầu trên Mobile, Cột trái trên PC) */}
          <div className="order-1 lg:order-none lg:col-start-1 lg:row-start-1 text-center lg:text-left">
            <motion.h1
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 tracking-tight leading-tight"
            >
              Học tiếng Anh qua
              <span className="text-blue-500 block mt-2">Phim ảnh</span>
            </motion.h1>
            <motion.div
              variants={itemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
            >
              <TypeAnimation
                sequence={[
                  "Xem phim yêu thích. Nhấp vào phụ đề để học từ vựng. Chơi game nhiều người. Thành thạo tiếng Anh một cách tự nhiên và vui vẻ!",
                  1000,
                ]}
                wrapper="p"
                speed={50}
                className="min-h-[40px] sm:min-h-[128px] text-base sm:text-lg md:text-xl text-gray-200 mb-0 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
                repeat={0}
                cursor={true}
              />
            </motion.div>
          </div>

          {/* 2. Cụm Ảnh (Thứ 2 trên Mobile, Cột phải từ trên xuống dưới trên PC) */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="order-2 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-3 flex items-center justify-center w-full max-w-2xl mx-auto mt-0 lg:mt-0"
          >
            <Image
              src="/img/loaibonen.png"
              alt="CineFluent"
              width={1000}
              height={800}
              className="w-full h-auto object-contain drop-shadow-2xl"
              priority
            />
          </motion.div>

          {/* 3. Nút Hành động (Thứ 3 trên Mobile, Dưới text cột trái trên PC) */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="order-3 lg:order-none lg:col-start-1 lg:row-start-2 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start mb-2 sm:mb-8"
          >
            <Link href="/studies/movies">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer rounded-sm flex items-center justify-center w-full sm:w-auto bg-blue-600 hover:from-gray-600 hover:to-blue-700 text-white shadow-xl shadow-blue-500/30 px-6 sm:px-8 py-3 sm:py-6 text-base sm:text-lg font-semibold"
              >
                <span className="mr-2">Xem & Học ngay</span> <SquarePlay />
              </motion.button>
            </Link>

            <Link href="/studies/games">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer rounded-sm flex items-center justify-center w-full sm:w-auto bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-6 sm:px-8 py-3 sm:py-6 text-base sm:text-lg font-semibold"
              >
                <span className="mr-2">Chơi Game</span>
              </motion.button>
            </Link>
          </motion.div>

          {/* 4. Thống kê (Cuối cùng trên Mobile, Dưới nút cột trái trên PC) */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.5 }}
            className="order-4 lg:order-none lg:col-start-1 lg:row-start-3 flex flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start text-sm sm:text-base mt-4 lg:mt-0"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-300">1000+ Bộ phim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-gray-300">50K+ Người học</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-gray-300">100K+ Lượt chơi</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
export default Banner;

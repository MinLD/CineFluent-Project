"use client";
import { useState, useEffect } from "react";

import Image from "next/image";
import { I_category } from "@/app/lib/types/categories";
import { Layers, Users } from "lucide-react";

type Props = {
  categories: I_category;
  className?: string;
};

function CardCategories({ categories, className = "" }: Props) {
  const [mockStats, setMockStats] = useState({
    mentors: 120, // Giá trị mặc định để tránh hydration mismatch
    creditRange: "1.2-2.5",
    onlineCount: 85, // Giá trị mặc định
  });

  useEffect(() => {
    setMockStats({
      mentors: Math.floor(Math.random() * 1000) + 100,
      creditRange: "1.2-2.5",
      onlineCount: Math.floor(Math.random() * 200) + 50,
    });
  }, []);

  return (
    <div
      className={`
        group bg-white rounded-2xl p-5
        border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 
        transition-all duration-300 ease-in-out
        cursor-pointer h-full flex flex-col justify-between
        ${className}
      `}
    >
      <div>
        {/* --- PHẦN XỬ LÝ ẢNH (ICON) --- */}
        <div className="w-18 h-18 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors duration-300">
          {categories.avatar?.secure_url ? (
            <div className="relative w-15 h-15">
              <Image
                fill // Dùng fill để ảnh tự bung theo cha (w-8 h-8)
                sizes="32px"
                alt={categories.name}
                src={categories.avatar.secure_url}
                className="object-contain p-0.5" // p-0.5 giúp ảnh ko bị sát viền nếu ảnh gốc quá to
              />
            </div>
          ) : (
            // Fallback: Nếu không có ảnh thì hiện icon mặc định đẹp mắt
            <Layers className="w-7 h-7 text-blue-600" />
          )}
        </div>

        {/* Tên danh mục */}
        <h3 className="min-h-[53px] text-[1.1rem] font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {categories.name}
        </h3>

        {/* Thông tin thống kê */}
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-4">
          <span className="flex items-center gap-1">
            <Users size={14} className="text-gray-400" /> {mockStats.mentors}{" "}
            mentor
          </span>
        </div>
      </div>

      {/* Footer Card: Trạng thái Online */}
      <div className="pt-1 border-t border-gray-50 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span className="text-xs text-gray-500 font-semibold">
          {mockStats.onlineCount} đang online
        </span>
      </div>
    </div>
  );
}

export default CardCategories;

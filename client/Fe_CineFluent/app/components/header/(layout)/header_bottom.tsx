"use client";

import Link from "next/link";
import MyLayout from "@/app/layout/index";
import MyWideLayout from "@/app/layout/WideLayout";
import { Filter, Search } from "lucide-react";
import VipButton from "@/app/components/buttons/VipButton";

function HeaderBottom() {
  return (
    <MyWideLayout>
      <div className="flex justify-between items-center h-[58px] gap-4">
        {/* Left Section (Placeholder for future Category/Filter) */}
        {/* Left Section (Placeholder for future Category/Filter) */}
        <div className="hidden md:flex w-[140px] lg:w-[200px] flex-shrink-0"></div>

        {/* Center Section: Search Bar */}
        <div className="flex-1 max-w-[700px] transition-all ease-in-out duration-300">
          <form className="relative group w-full">
            <input
              placeholder="Tìm kiếm phim, bài học..."
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-12 pr-4 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all shadow-sm"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors"
              size={18}
            />
          </form>
        </div>

        {/* Right Section: VIP Button */}
        <div className="flex w-auto md:w-[140px] lg:w-[200px] justify-end items-center flex-shrink-0">
          <VipButton />
        </div>
      </div>
    </MyWideLayout>
  );
}

export default HeaderBottom;

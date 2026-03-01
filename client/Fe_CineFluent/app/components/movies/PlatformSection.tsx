"use client";

import { RightCircleOutlined, RightOutlined } from "@ant-design/icons";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface PlatformSectionProps {
  title: string;
  icon: ReactNode;
  description: string;
  iconColor?: string;
  accentColor?: string;
  children: ReactNode;
}

export function PlatformSection({
  title,
  icon,
  description,
  iconColor = "text-blue-500",
  accentColor = "bg-blue-500/20",
  children,
}: PlatformSectionProps) {
  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className="h-12 w-2 bg-blue-500 rounded-full shrink-0 mt-1 sm:mt-0" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0 pr-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate whitespace-normal sm:whitespace-nowrap sm:truncate line-clamp-2 sm:line-clamp-none">
                {title}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 sm:line-clamp-1">
                {description}
              </p>
            </div>
            <div className="hidden sm:block cursor-pointer shrink-0">
              <ChevronRight
                className="text-gray-400 hover:text-blue-500 transition-colors"
                width={30}
                height={30}
              />
            </div>
          </div>
        </div>
        <div className="cursor-pointer shrink-0 flex items-center h-full sm:h-auto mt-2 sm:mt-0">
          <h3 className="text-gray-400 text-sm sm:text-base hover:text-blue-500 transition-colors flex items-center">
            <span>Xem tất cả</span>
            <ChevronRight className="w-4 h-4 sm:hidden ml-1" />
          </h3>
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        {/* Scrollable Content */}
        <div className="flex gap-4 overflow-x-auto pb-4 scroll-smooth scrollbar-hide">
          {children}
        </div>
      </div>
    </section>
  );
}

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
      <div className="flex  justify-between items-center">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-2 bg-blue-500 rounded-full" />
          <div className="flex items-center justify-center gap-3">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
              <p className="text-slate-400 text-sm">{description}</p>
            </div>
            <div className="cursor-pointer">
              <ChevronRight
                className="text-gray-400 hover:text-blue-500 transition-colors"
                width={30}
                height={30}
              />
            </div>
          </div>
        </div>
        <div className="cursor-pointer">
          <h3 className="text-gray-400 hover:text-blue-500 transition-colors">
            Xem tất cả
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

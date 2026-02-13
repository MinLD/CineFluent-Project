"use client";

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
      <div className="flex items-center gap-4 mb-6">
        <div
          className={`p-3 bg-slate-800 rounded-xl border border-slate-700 ${iconColor}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
          <p className="text-slate-400 text-sm">{description}</p>
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

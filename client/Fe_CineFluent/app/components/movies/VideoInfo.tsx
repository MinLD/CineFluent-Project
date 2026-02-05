"use client";

import Link from "next/link";
import { Play, Eye, Youtube, HardDrive, Globe } from "lucide-react";

interface VideoInfoProps {
  video: {
    id: number;
    title: string;
    source_type: "youtube" | "drive" | "local";
    level: string;
    view_count: number;
    category?: { name: string };
    subtitles?: any[];
  };
}

export function VideoInfo({ video }: VideoInfoProps) {
  const sourceIcons = {
    youtube: { icon: Youtube, label: "YouTube" },
    drive: { icon: HardDrive, label: "Google Drive" },
    local: { icon: Globe, label: "Web" },
  };

  const source = sourceIcons[video.source_type] || sourceIcons.local;
  const SourceIcon = source.icon;

  const levelColors = {
    Beginner: "bg-green-500",
    Intermediate: "bg-yellow-500",
    Advanced: "bg-red-500",
  };

  const levelColor =
    levelColors[video.level as keyof typeof levelColors] || "bg-gray-500";

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>

      {/* Badges */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {/* Source */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
          <SourceIcon className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-slate-300">{source.label}</span>
        </div>

        {/* Category */}
        {video.category && (
          <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-sm rounded-full">
            {video.category.name}
          </span>
        )}

        {/* Level */}
        <span
          className={`px-3 py-1.5 ${levelColor} text-white text-sm rounded-full`}
        >
          {video.level}
        </span>

        {/* View Count */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
          <Eye className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-300">
            {video.view_count?.toLocaleString() || 0} views
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Tổng phụ đề</p>
          <p className="text-2xl font-bold text-white">
            {video.subtitles?.length || 0}
          </p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-slate-400 text-sm mb-1">Mức độ</p>
          <p className="text-2xl font-bold text-white">{video.level}</p>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Eye, Youtube, HardDrive, Globe } from "lucide-react";

interface VideoCardProps {
  video: {
    id: number;
    title: string;
    thumbnail_url: string;
    source_type: "youtube" | "drive" | "local";
    level: string;
    slug: string;
    view_count: number;
    category?: { name: string };
  };
}

export function VideoCard({ video }: VideoCardProps) {
  const sourceIcons = {
    youtube: Youtube,
    drive: HardDrive,
    local: Globe,
  };

  const SourceIcon = sourceIcons[video.source_type] || Globe;

  return (
    <Link href={`/studies/movies/${video.slug}`}>
      <div className="flex-shrink-0 w-[280px] group relative overflow-hidden rounded-lg bg-slate-800 border border-slate-700  transition-all duration-300 cursor-pointer">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-slate-900">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="w-16 h-16 text-slate-600" />
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
          </div>

          {/* Source Badge */}
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full p-2">
            <SourceIcon className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold line-clamp-2 mb-2 group-hover:text-blue-400 transition">
            {video.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

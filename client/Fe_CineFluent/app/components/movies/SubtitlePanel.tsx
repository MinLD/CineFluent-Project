"use client";

import { useRef, useEffect, useState } from "react";
import {
  Clock,
  Plus,
  Minus,
  Mic,
  Keyboard,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { tokenizeText } from "@/app/utils/tokenizeText";
import { findCurrentSubtitleIndex } from "@/app/utils/binarySearch";
import { SubtitleItem } from "./SubtitleItem";
import { SubtitleSkeleton } from "./SubtitleSkeleton";

interface Subtitle {
  id: number;
  start_time: number;
  end_time: number;
  content_en: string;
  content_vi: string | null;
}

interface SubtitlePanelProps {
  subtitles: Subtitle[];
  currentTime?: number;
  onSubtitleClick?: (time: number) => void;
  onPracticeClick?: (subtitle: Subtitle) => void;
  handleShowShadowingWhenClickSub?: (time: number, subtitle: Subtitle) => void;
  onWordClick?: (word: string, context: string) => void;
  onDictationClick?: (subtitle: Subtitle) => void; // Callback khi bấm nút Keyboard
  onClose?: () => void;
  isBlurred?: boolean;
  onToggleBlur?: () => void;
  onSeek?: (time: number) => void;
  isExternalMovie?: boolean;
  activeIndex?: number;
}

export function SubtitlePanel({
  subtitles,
  currentTime = 0,
  activeIndex = -1,
  onSubtitleClick,
  onPracticeClick,
  handleShowShadowingWhenClickSub,
  onWordClick,
  onDictationClick,
  onClose,
  isBlurred = false,
  onToggleBlur,
}: SubtitlePanelProps) {
  const currentIndex =
    activeIndex !== -1
      ? activeIndex
      : findCurrentSubtitleIndex(subtitles, currentTime);

  const containerRef = useRef<HTMLDivElement>(null);

  // [VTT_OPTIMIZATION] Virtual Scroll State
  const [scrollTop, setScrollTop] = useState(0);
  const ITEM_HEIGHT = 100; // Chiều cao ước tính của 1 câu sub
  const CONTAINER_HEIGHT = 600; // Chiều cao khung nhìn
  const BUFFER = 5; // Số lượng câu sub vẽ thêm ở trên/dưới để cuộn mượt

  // Reset scroll to top on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Tính toán vùng hiển thị
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
  const endIndex = Math.min(
    subtitles.length - 1,
    Math.floor((scrollTop + CONTAINER_HEIGHT) / ITEM_HEIGHT) + BUFFER,
  );

  const visibleSubtitles = subtitles.slice(startIndex, endIndex + 1);
  const totalHeight = subtitles.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  useEffect(() => {
    if (currentIndex >= 0 && containerRef.current && currentTime > 0) {
      const container = containerRef.current;

      // [VTT_OPTIMIZATION] Tính toán vị trí cuộn cho Virtual List
      const targetScroll =
        currentIndex * ITEM_HEIGHT - CONTAINER_HEIGHT / 2 + ITEM_HEIGHT / 2;

      container.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    }
  }, [currentIndex]); // Chỉ scroll khi đổi câu thoại

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-slate-900 h-[600px] lg:h-full flex flex-col">
      {/* Header */}
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          PHỤ ĐỀ SONG NGỮ
        </h2>
        <div className="flex items-center gap-2">
          {/* Blur Toggle */}
          <button
            onClick={onToggleBlur}
            className={`hover:cursor-pointer p-2 rounded-lg transition-all ${
              isBlurred
                ? "bg-blue-500/20 text-blue-400"
                : "bg-slate-700 hover:bg-slate-600 text-slate-400 hover:text-white"
            }`}
            title={isBlurred ? "Hiện phụ đề" : "Làm mờ phụ đề"}
          >
            {isBlurred ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className="hover:cursor-pointer p-2 bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
            title="Đóng danh sách"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subtitle List */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-hide"
      >
        {subtitles.length === 0 ? (
          <SubtitleSkeleton />
        ) : (
          <div className="relative p-4" style={{ height: `${totalHeight}px` }}>
            <div
              className="space-y-2 absolute left-4 right-4"
              style={{ transform: `translateY(${offsetY}px)` }}
            >
              {visibleSubtitles.map((subtitle, idx) => {
                const actualIndex = startIndex + idx;
                return (
                  <SubtitleItem
                    key={subtitle.id}
                    subtitle={subtitle}
                    index={actualIndex}
                    currentIndex={currentIndex}
                    isBlurred={isBlurred}
                    onSubtitleClick={onSubtitleClick}
                    onPracticeClick={handleShowShadowingWhenClickSub}
                    onDictationClick={onDictationClick}
                    onWordClick={onWordClick}
                    formatTime={formatTime}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

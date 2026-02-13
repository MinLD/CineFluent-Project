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
}

export function SubtitlePanel({
  subtitles,  
  currentTime = 0,
  onSubtitleClick,
  onPracticeClick,
  handleShowShadowingWhenClickSub,
  onWordClick,
  onDictationClick,
  onClose,
  isBlurred = false,
  onToggleBlur,
}: SubtitlePanelProps) {
  const adjustedTime = currentTime;

  // Tìm subtitle hiện tại bằng Binary Search - O(log n) thay vì O(n)
  // Tìm subtitle có start_time gần nhất (nhưng không vượt quá) thời gian hiện tại
  const findCurrentSubtitleIndex = (time: number): number => {
    if (subtitles.length === 0) return -1;

    let left = 0;
    let right = subtitles.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      // Nếu subtitle này đã bắt đầu (start_time <= time)
      if (subtitles[mid].start_time <= time) {
        result = mid; // Lưu lại vị trí này
        left = mid + 1; // Tìm subtitle muộn hơn ở bên phải
      } else {
        right = mid - 1; // Tìm subtitle sớm hơn ở bên trái
      }
    }

    return result;
  };

  const currentIndex = findCurrentSubtitleIndex(adjustedTime);

  const subtitleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset scroll to top on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;

      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (currentIndex >= 0 && containerRef.current && currentTime > 0) {
      const subtitleElement = subtitleRefs.current[currentIndex];
      const container = containerRef.current;

      if (!subtitleElement) return;

      const containerRect = container.getBoundingClientRect();
      const subtitleRect = subtitleElement.getBoundingClientRect();

      const containerCenter = containerRect.height / 2;
      const subtitleCenter =
        subtitleRect.top - containerRect.top + subtitleRect.height / 2;
      const scrollOffset = subtitleCenter - containerCenter;

      container.scrollBy({
        top: scrollOffset,
        behavior: "smooth",
      });
    }
  }, [currentIndex, currentTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2 ">
          {subtitles.map((subtitle, index) => (
            <div
              key={subtitle.id}
              ref={(el) => {
                subtitleRefs.current[index] = el;
              }}
              onClick={() => onSubtitleClick?.(subtitle.start_time)}
              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 relative group ${
                index === currentIndex
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
            >
              {/* Practice Button (Top Right) */}
              <div className="flex flex-col gap-2  absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowShadowingWhenClickSub?.(
                      subtitle.start_time,
                      subtitle,
                    );
                  }}
                  className={`hover:cursor-pointer p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                    index === currentIndex
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-slate-600 hover:bg-blue-500 text-slate-200 hover:text-white"
                  }`}
                  title="Luyện nói câu này"
                >
                  <div className="bg-white-500 rounded-full p-1">
                    <Mic className="w-3 h-3 text-white" />
                  </div>
                </button>
                {/* NÚT DICTATION (MỚI) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDictationClick?.(subtitle);
                  }}
                  className={`hover:cursor-pointer p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                    index === currentIndex
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-slate-600 hover:bg-blue-500 text-slate-200 hover:text-white"
                  }`}
                  title="Luyện viết câu này"
                >
                  <div className="bg-white-500 rounded-full p-1">
                    <Keyboard className="w-3 h-3 text-white" />
                  </div>
                </button>
              </div>

              {/* English */}
              <p
                className={`font-medium mb-1 pr-8 text-white/90 transition-all duration-300 ${
                  isBlurred ? "blur-[5px] select-none hover:blur-0" : ""
                }`}
              >
                {tokenizeText(subtitle.content_en)?.map((token, i) => {
                  if (token.isWord) {
                    return (
                      <span
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          onWordClick?.(token.text, subtitle.content_en);
                        }}
                        className="inline-block cursor-pointer transition-colors duration-200 border-b-2 border-transparent hover:border-yellow-400 hover:text-yellow-400 pb-[1px]"
                      >
                        {token.text}
                      </span>
                    );
                  } else {
                    return <span key={i}>{token.text}</span>;
                  }
                })}
              </p>

              {/* Vietnamese */}
              {subtitle.content_vi && (
                <p
                  className={`text-sm transition-all duration-300 ${
                    index === currentIndex ? "text-blue-100" : "text-slate-400"
                  } ${isBlurred ? "blur-[5px] select-none hover:blur-0" : ""}`}
                >
                  {subtitle.content_vi}
                </p>
              )}

              {/* Timestamp */}
              <div
                className={`flex items-center gap-1 mt-2 text-xs ${
                  index === currentIndex ? "text-blue-200" : "text-slate-500"
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{formatTime(subtitle.start_time)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

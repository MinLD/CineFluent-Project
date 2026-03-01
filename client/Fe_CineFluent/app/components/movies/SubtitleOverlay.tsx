"use client";

import { tokenizeText } from "@/app/utils/tokenizeText";
import { findCurrentSubtitleIndex } from "@/app/utils/binarySearch";
import { useMemo } from "react";

interface Subtitle {
  id: number;
  start_time: number;
  end_time: number;
  content_en: string;
  content_vi: string | null;
}

interface SubtitleSettings {
  fontSize: string;
  bgOpacity: number;
}

interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  activeIndex?: number;
  currentTime: number;
  subtitleMode: "both" | "en" | "off";
  onWordClick: (word: string, context: string) => void;
  settings?: SubtitleSettings;
  isBlurred?: boolean;
}

export function SubtitleOverlay({
  subtitles,
  activeIndex = -1,
  currentTime,
  subtitleMode,
  onWordClick,
  settings = { fontSize: "medium", bgOpacity: 0.9 },
  isBlurred = false,
}: SubtitleOverlayProps) {
  // Tìm subtitle hiện tại bằng Binary Search - O(log n)
  const currentSubtitle = useMemo(() => {
    if (subtitles.length === 0) return null;

    const idx =
      activeIndex !== -1
        ? activeIndex
        : findCurrentSubtitleIndex(subtitles, currentTime);
    if (idx === -1) return null;

    const subtitle = subtitles[idx];
    // Kiểm tra xem subtitle có đang trong khoảng thời gian hiển thị không
    if (
      currentTime >= subtitle.start_time &&
      currentTime <= subtitle.end_time
    ) {
      return subtitle;
    }

    return null;
  }, [subtitles, activeIndex, currentTime]);

  const tokens_sub = useMemo(() => {
    if (!currentSubtitle) return [];
    return tokenizeText(currentSubtitle.content_en);
  }, [currentSubtitle?.id]);

  // Không hiển thị gì nếu không có subtitle hoặc mode là OFF
  if (!currentSubtitle || subtitleMode === "off") return null;

  // Font size classes
  const fontSizeClass = {
    small: "text-base md:text-lg",
    medium: "text-lg md:text-xl",
    large: "text-xl md:text-2xl",
  }[settings.fontSize];

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center px-1 sm:px-4 pointer-events-none z-[10]">
      <div
        className="backdrop-blur-sm rounded-lg px-2 sm:px-6 py-1 sm:py-3 max-w-[85%] shadow-2xl border border-white/10 pointer-events-auto transition-all hover:bg-black/95"
        style={{ backgroundColor: `rgba(0, 0, 0, ${settings.bgOpacity})` }}
      >
        {/* Tiếng Anh - Dòng chính */}
        <p
          className={`text-xs sm:text-sm md:text-base text-white font-semibold text-center leading-relaxed text-shadow-lg ${fontSizeClass} ${
            isBlurred
              ? "blur-[5px] select-none hover:blur-0 transition-all"
              : ""
          }`}
        >
          {tokens_sub.map((token, index) => {
            if (token.isWord) {
              return (
                <span
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWordClick(token.text, currentSubtitle.content_en);
                  }}
                  className="inline-block cursor-pointer transition-colors duration-200 border-b-2 border-transparent hover:border-yellow-400 hover:text-yellow-400 pb-0.5 rounded px-0.5"
                >
                  {token.text}
                </span>
              );
            } else {
              return (
                <span key={index} className="text-white">
                  {token.text}
                </span>
              );
            }
          })}
        </p>

        {/* Tiếng Việt - Dòng phụ (chỉ hiển thị khi mode là "both") */}
        {subtitleMode === "both" && currentSubtitle.content_vi && (
          <p
            className={`text-yellow-300 text-xs md:text-base text-center mt-1 leading-relaxed text-shadow-md ${
              isBlurred
                ? "blur-[5px] select-none hover:blur-0 transition-all"
                : ""
            }`}
          >
            {currentSubtitle.content_vi}
          </p>
        )}
      </div>
    </div>
  );
}

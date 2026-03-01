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
  showControls?: boolean;
  showSubtitlePanel?: boolean;
}

export function SubtitleOverlay({
  subtitles,
  activeIndex = -1,
  currentTime,
  subtitleMode,
  onWordClick,
  settings = { fontSize: "medium", bgOpacity: 0.9 },
  isBlurred = false,
  showControls = true,
  showSubtitlePanel = false,
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
    small: "text-[10px] sm:text-sm md:text-base",
    medium: "text-[11px] sm:text-base md:text-lg",
    large: "text-xs sm:text-lg md:text-xl",
  }[settings.fontSize];

  let bottomClass = showControls
    ? "bottom-[80px] sm:bottom-24"
    : "bottom-2 sm:bottom-10";

  return (
    <div
      className={`absolute left-0 right-0 flex justify-center px-1 sm:px-4 pointer-events-none z-[20] transition-all duration-300 ease-in-out ${bottomClass}`}
    >
      <div className="px-2 sm:px-6 py-0.5 sm:py-2 max-w-[95%] md:max-w-[75%] pointer-events-auto transition-all">
        {/* Tiếng Anh - Dòng chính */}
        <p
          className={`text-white font-semibold text-center leading-snug sm:leading-relaxed ${fontSizeClass} ${
            isBlurred
              ? "blur-[5px] select-none hover:blur-0 transition-all"
              : ""
          }`}
          style={{
            textShadow:
              "0px 1px 4px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,1)",
          }}
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
            className={`text-yellow-300 text-[9px] sm:text-sm md:text-base text-center mt-0.5 leading-snug sm:leading-relaxed ${
              isBlurred
                ? "blur-[5px] select-none hover:blur-0 transition-all"
                : ""
            }`}
            style={{
              textShadow:
                "0px 1px 3px rgba(0,0,0,0.9), 0px 0px 2px rgba(0,0,0,1)",
            }}
          >
            {currentSubtitle.content_vi}
          </p>
        )}
      </div>
    </div>
  );
}

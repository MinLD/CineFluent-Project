"use client";

import { useMemo } from "react";

interface Subtitle {
  id: number;
  start_time: number;
  end_time: number;
  content_en: string;
  content_vi: string | null;
}

interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  currentTime: number;
  subtitleMode: "both" | "en" | "off";
}

export function SubtitleOverlay({
  subtitles,
  currentTime,
  subtitleMode,
}: SubtitleOverlayProps) {
  // Tìm subtitle hiện tại bằng Binary Search - O(log n)
  const currentSubtitle = useMemo(() => {
    if (subtitles.length === 0) return null;

    let left = 0;
    let right = subtitles.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      if (subtitles[mid].start_time <= currentTime) {
        result = mid;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (result === -1) return null;

    const subtitle = subtitles[result];
    // Kiểm tra xem subtitle có đang trong khoảng thời gian hiển thị không
    if (
      currentTime >= subtitle.start_time &&
      currentTime <= subtitle.end_time
    ) {
      return subtitle;
    }

    return null;
  }, [subtitles, currentTime]);

  // Không hiển thị gì nếu không có subtitle hoặc mode là OFF
  if (!currentSubtitle || subtitleMode === "off") return null;

  return (
    <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4 pointer-events-none z-[5]">
      <div className="bg-black/90 backdrop-blur-sm rounded-lg px-6 py-3 max-w-[85%] shadow-2xl border border-white/10">
        {/* Tiếng Anh - Dòng chính */}
        <p className="text-white text-lg md:text-xl font-semibold text-center leading-relaxed text-shadow-lg">
          {currentSubtitle.content_en}
        </p>

        {/* Tiếng Việt - Dòng phụ (chỉ hiển thị khi mode là "both") */}
        {subtitleMode === "both" && currentSubtitle.content_vi && (
          <p className="text-yellow-300 text-sm md:text-base text-center mt-1 leading-relaxed text-shadow-md">
            {currentSubtitle.content_vi}
          </p>
        )}
      </div>
    </div>
  );
}

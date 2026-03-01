"use client";

import React from "react";
import { Mic, Keyboard, Clock } from "lucide-react";
import { I_Subtitle } from "@/app/lib/types/video";
import { tokenizeText } from "@/app/utils/tokenizeText";

interface SubtitleItemProps {
  subtitle: I_Subtitle;
  index: number;
  currentIndex: number;
  isBlurred: boolean;
  onSubtitleClick?: (time: number) => void;
  onPracticeClick?: (time: number, subtitle: I_Subtitle) => void;
  onDictationClick?: (subtitle: I_Subtitle) => void;
  onWordClick?: (word: string, context: string) => void;
  formatTime: (seconds: number) => string;
}

export const SubtitleItem = React.memo(
  ({
    subtitle,
    index,
    currentIndex,
    isBlurred,
    onSubtitleClick,
    onPracticeClick,
    onDictationClick,
    onWordClick,
    formatTime,
  }: SubtitleItemProps) => {
    const isActive = index === currentIndex;

    return (
      <div
        onClick={() => onSubtitleClick?.(subtitle.start_time)}
        className={`p-3 rounded-lg cursor-pointer transition-all duration-200 relative group min-h-[80px] ${
          isActive
            ? "bg-blue-600 text-white shadow-lg"
            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
        }`}
      >
        {/* Action Buttons */}
        <div className="flex flex-col gap-4 absolute bottom-1/2 translate-y-1/2 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPracticeClick?.(subtitle.start_time, subtitle);
            }}
            className={`hover:cursor-pointer p-1.5 rounded-full transition-all ${
              isActive
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-slate-600 hover:bg-blue-500 text-slate-200 hover:text-white"
            }`}
            title="Luyện nói"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDictationClick?.(subtitle);
            }}
            className={`hover:cursor-pointer p-1.5 rounded-full transition-all ${
              isActive
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-slate-600 hover:bg-blue-500 text-slate-200 hover:text-white"
            }`}
            title="Luyện viết"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

        {/* English Text Content */}
        <p
          className={`max-w-[90%] font-medium mb-1 pr-8 text-white/90 transition-all duration-300 ${
            isBlurred ? "blur-[5px] select-none hover:blur-0" : ""
          }`}
        >
          {tokenizeText(subtitle.content_en)?.map((token, i) =>
            token.isWord ? (
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
            ) : (
              <span key={i}>{token.text}</span>
            ),
          )}
        </p>

        {/* Vietnamese Content */}
        {subtitle.content_vi && (
          <p
            className={`max-w-[90%] text-sm transition-all duration-300 ${
              isActive ? "text-blue-100" : "text-slate-400"
            } ${isBlurred ? "blur-[5px] select-none hover:blur-0" : ""}`}
          >
            {subtitle.content_vi}
          </p>
        )}

        {/* Time Info */}
        <div
          className={`flex items-center gap-1 mt-2 text-xs ${
            isActive ? "text-blue-200" : "text-slate-500"
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(subtitle.start_time)}</span>
        </div>
      </div>
    );
  },
);

SubtitleItem.displayName = "SubtitleItem";

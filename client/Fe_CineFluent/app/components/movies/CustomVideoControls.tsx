"use client";

import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  List,
  Eye,
  Mic,
  RotateCcw,
  ChevronRight,
  Check,
  ChevronLeft,
} from "lucide-react";

interface CustomVideoControlsProps {
  playerRef: React.RefObject<any>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onFullscreen: () => void;
  subtitleMode: "both" | "en" | "off";
  onSubtitleModeChange: (mode: "both" | "en" | "off") => void;
  showSubtitlePanel: boolean;
  onShowSubtitlePanelChange: (show: boolean) => void;
  qualities?: string[];
  currentQuality?: string;
  onQualityChange?: (quality: string) => void;
  subtitleSettings?: { fontSize: string; bgOpacity: number };
  onSubtitleSettingsChange?: (settings: {
    fontSize: string;
    bgOpacity: number;
  }) => void;
}

export function CustomVideoControls({
  playerRef,
  currentTime,
  duration,
  isPlaying,
  volume,
  playbackRate,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onPlaybackRateChange,
  onFullscreen,
  subtitleMode,
  onSubtitleModeChange,
  showSubtitlePanel,
  onShowSubtitlePanelChange,
  qualities = [],
  currentQuality = "auto",
  onQualityChange,
  subtitleSettings,
  onSubtitleSettingsChange,
}: CustomVideoControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState<
    "main" | "quality" | "subtitle_appearance"
  >("main");
  const [isDragging, setIsDragging] = useState(false);

  // Reset menu to main when closing
  useEffect(() => {
    if (!showSettingsMenu) {
      setActiveMenu("main");
    }
  }, [showSettingsMenu]);

  // Settings states (local only for features not yet implemented)
  const [shadowingMode, setShadowingMode] = useState(false);
  const [dictationMode, setDictationMode] = useState(false);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Format thời gian: mm:ss
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

  // Tính phần trăm progress
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle seek khi click hoặc drag trên progress bar
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    onSeek(newTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleOnShadowing = () => {
    setShadowingMode(!shadowingMode);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const progressBar = document.getElementById("progress-bar");
      if (!progressBar) return;

      const rect = progressBar.getBoundingClientRect();
      const pos = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      const newTime = pos * duration;
      onSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, duration, onSeek]);

  return (
    <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 sm:p-4 pb-4 sm:pb-6 pt-10 sm:pt-12 relative z-[11]">
      {/* Progress Bar */}
      <div
        id="progress-bar"
        className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group hover:h-2 transition-all"
        onMouseDown={handleProgressMouseDown}
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-blue-500 rounded-full relative transition-all group-hover:bg-blue-400"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Play/Pause + Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayPause}
            className="text-white hover:text-blue-400 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-full"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </button>

          <span className="text-white text-xs sm:text-sm font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right: Volume + Speed + Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Volume */}
          {/* Volume */}
          {/* Volume */}
          <div
            className="flex items-center relative"
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <div
              onMouseEnter={() => {
                setShowVolumeSlider(true);
                setShowSpeedMenu(false);
                setShowSettingsMenu(false);
              }}
              className="flex items-center bg-transparent hover:bg-black/60 rounded-full transition-all duration-300 border border-transparent hover:border-white/10 pr-0 hover:pr-3 group/vol"
            >
              <button
                onClick={() => onVolumeChange(volume > 0 ? 0 : 100)}
                className="text-white hover:text-blue-400 transition-colors p-1.5 sm:p-2 rounded-full"
                aria-label={volume > 0 ? "Mute" : "Unmute"}
              >
                {volume > 0 ? (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              <div className="w-0 overflow-hidden group-hover/vol:w-[140px] transition-all duration-300 ease-out flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => onVolumeChange(Number(e.target.value))}
                  className="w-20 mx-3 h-1 accent-blue-500 cursor-pointer hover:h-1.5 transition-all"
                />
                <span className="text-white text-xs font-mono tabular-nums pr-3">
                  {Math.round(volume)}%
                </span>
              </div>
            </div>
          </div>

          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowSettingsMenu(false);
                setShowVolumeSlider(false);
              }}
              className="text-white hover:text-blue-400 transition-colors px-2 py-1 sm:px-3 sm:py-1.5 hover:bg-white/10 rounded-lg text-xs sm:text-sm font-medium"
              aria-label="Playback speed"
            >
              {playbackRate}x
            </button>

            {/* Speed Menu */}
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-black/90 backdrop-blur-sm rounded-lg shadow-xl border border-white/10 overflow-hidden">
                {speedOptions.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      onPlaybackRateChange(speed);
                      setShowSpeedMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-sm text-left transition-colors ${
                      playbackRate === speed
                        ? "bg-blue-500 text-white"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSettingsMenu(!showSettingsMenu);
                setShowSpeedMenu(false);
                setShowVolumeSlider(false);
              }}
              className="text-white hover:text-blue-400 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-full"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Settings Menu */}
            {showSettingsMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-black/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/10 overflow-y-auto max-h-[180px] sm:max-h-[300px] min-w-[220px] sm:min-w-[300px] z-[5] animate-fade-in scrollbar-thin scrollbar-thumb-white/20">
                {/* --- MAIN MENU --- */}
                {activeMenu === "main" && (
                  <div className="py-1 sm:py-2">
                    {/* Subtitle Mode */}
                    <div className="px-2 sm:px-4 py-1 sm:py-2 flex items-center justify-between border-b border-white/10 mb-1 sm:mb-2 gap-1 sm:gap-2">
                      <span className="text-[10px] sm:text-sm font-medium text-white whitespace-nowrap">
                        Phụ đề
                      </span>
                      <div className="flex bg-white/10 rounded overflow-hidden">
                        <button
                          onClick={() => onSubtitleModeChange("both")}
                          className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs transition-colors ${
                            subtitleMode === "both"
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          EN+VI
                        </button>
                        <button
                          onClick={() => onSubtitleModeChange("en")}
                          className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs transition-colors ${
                            subtitleMode === "en"
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          onClick={() => onSubtitleModeChange("off")}
                          className={`px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs transition-colors ${
                            subtitleMode === "off"
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          OFF
                        </button>
                      </div>
                    </div>

                    {/* Quality */}
                    <button
                      onClick={() => setActiveMenu("quality")}
                      className="w-full px-2 sm:px-4 py-1.5 sm:py-3 text-[10px] sm:text-sm text-left transition-colors flex items-center justify-between hover:bg-white/10 text-white"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Hình ảnh</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="text-[10px] sm:text-xs">
                          {currentQuality || "Auto"}
                        </span>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                    </button>

                    {/* Subtitle Panel Toggle */}
                    <button
                      onClick={() =>
                        onShowSubtitlePanelChange(!showSubtitlePanel)
                      }
                      className="w-full px-2 sm:px-4 py-1.5 sm:py-3 text-[10px] sm:text-sm text-left transition-colors flex items-center justify-between hover:bg-white/10 text-white"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <List className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>DS phụ đề</span>
                      </div>
                      <div
                        className={`w-8 sm:w-10 h-4 sm:h-5 rounded-full transition-colors relative ${
                          showSubtitlePanel ? "bg-blue-500" : "bg-gray-600"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full absolute top-[2px] transition-all ${
                            showSubtitlePanel
                              ? "left-[18px] sm:left-[22px]"
                              : "left-[2px]"
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                )}

                {/* --- QUALITY MENU --- */}
                {activeMenu === "quality" && (
                  <div className="py-1 sm:py-2">
                    <button
                      onClick={() => setActiveMenu("main")}
                      className="w-full px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm text-left text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-1.5 sm:gap-2 border-b border-white/10 mb-0.5 sm:mb-1"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                      Quay lại
                    </button>
                    {(qualities || [])
                      .filter((q) => q !== "small" && q !== "tiny")
                      .map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            onQualityChange?.(q);
                            setShowSettingsMenu(false);
                          }}
                          className="w-full px-2 sm:px-4 py-1.5 sm:py-2.5 text-[10px] sm:text-sm text-left transition-colors flex items-center justify-between hover:bg-white/10 text-white"
                        >
                          <span>
                            {q === "auto"
                              ? "Tự động"
                              : q === "highres"
                                ? "4K/Original"
                                : q === "hd1080"
                                  ? "1080p"
                                  : q === "hd720"
                                    ? "720p"
                                    : q === "large"
                                      ? "480p"
                                      : q === "medium"
                                        ? "360p"
                                        : q}
                          </span>
                          {currentQuality === q && (
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={onFullscreen}
            className="text-white hover:text-blue-400 transition-colors p-1.5 sm:p-2 hover:bg-white/10 rounded-full"
            aria-label="Fullscreen"
          >
            <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

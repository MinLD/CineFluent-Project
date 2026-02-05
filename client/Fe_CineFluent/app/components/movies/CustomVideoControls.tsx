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
}: CustomVideoControlsProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Settings states (local only for features not yet implemented)
  const [shadowingMode, setShadowingMode] = useState(false);
  const [dictationMode, setDictationMode] = useState(false);

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Format thời gian: mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 z-10">
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
      <div className="flex items-center justify-between gap-4">
        {/* Left: Play/Pause + Time */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPlayPause}
            className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <span className="text-white text-sm font-medium">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Right: Volume + Speed + Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Volume */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 100)}
              className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label={volume > 0 ? "Mute" : "Unmute"}
            >
              {volume > 0 ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </button>

            {/* Volume Slider */}
            {showVolumeSlider && (
              <div className="absolute bottom-full -mb-1 left-1/2 -translate-x-1/2 backdrop-blur-sm rounded-lg px-[1px] pt-4 pb-4 shadow-xl border border-white/10">
                <div className="h-16 flex items-center justify-center">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => onVolumeChange(Number(e.target.value))}
                    className="w-18 h-1 accent-blue-500 cursor-pointer"
                    style={{
                      transform: "rotate(-90deg)",
                      transformOrigin: "center",
                    }}
                  />
                </div>
                <div className="text-white text-xs text-center mt-1">
                  {Math.round(volume)}%
                </div>
              </div>
            )}
          </div>

          {/* Playback Speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="text-white hover:text-blue-400 transition-colors px-3 py-1.5 hover:bg-white/10 rounded-lg text-sm font-medium"
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
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Settings Menu */}
            {showSettingsMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-black/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/10 overflow-y-auto max-h-[400px] min-w-[280px] z-[5]">
                {/* Subtitle Display Mode */}
                <div className="border-b border-white/10">
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold">
                    Hiển thị phụ đề
                  </div>
                  <button
                    onClick={() => onSubtitleModeChange("both")}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-3 ${
                      subtitleMode === "both"
                        ? "bg-yellow-600 text-white"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <Subtitles className="w-4 h-4" />
                    <span>EN + VI</span>
                  </button>
                  <button
                    onClick={() => onSubtitleModeChange("en")}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-3 ${
                      subtitleMode === "en"
                        ? "bg-yellow-600 text-white"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <Subtitles className="w-4 h-4" />
                    <span>EN</span>
                  </button>
                  <button
                    onClick={() => onSubtitleModeChange("off")}
                    className={`w-full px-4 py-2.5 text-sm text-left transition-colors flex items-center gap-3 ${
                      subtitleMode === "off"
                        ? "bg-yellow-600 text-white"
                        : "text-white hover:bg-white/10"
                    }`}
                  >
                    <Subtitles className="w-4 h-4" />
                    <span>OFF</span>
                  </button>
                </div>

                {/* Subtitle Panel Toggle */}
                <div className="border-b border-white/10">
                  <button
                    onClick={() =>
                      onShowSubtitlePanelChange(!showSubtitlePanel)
                    }
                    className="w-full px-4 py-3 text-sm text-left transition-colors flex items-center justify-between hover:bg-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <List className="w-4 h-4 text-white" />
                      <span className="text-white">Danh sách phụ đề</span>
                    </div>
                    <div
                      className={`w-10 h-5 rounded-full transition-colors ${
                        showSubtitlePanel ? "bg-blue-500" : "bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                          showSubtitlePanel ? "ml-5" : "ml-0.5"
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Shadowing Mode */}
                <div className="border-b border-white/10">
                  <button
                    onClick={() => handleOnShadowing()}
                    className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Eye className="w-4 h-4 text-white" />
                        <div>
                          <div className="text-white font-medium">
                            Bật chế độ Shadowing
                          </div>
                          <div className="text-xs text-gray-400">
                            Tự động dừng để luyện nói
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full transition-colors ${
                          shadowingMode ? "bg-blue-500" : "bg-gray-600"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                            shadowingMode ? "ml-5" : "ml-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                </div>

                {/* Dictation Mode */}
                <div>
                  <button
                    onClick={() => setDictationMode(!dictationMode)}
                    className="w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mic className="w-4 h-4 text-white" />
                        <div>
                          <div className="text-white font-medium">
                            Bật chế độ Nghe chép
                          </div>
                          <div className="text-xs text-gray-400">
                            Tự động dừng để gõ lại câu thoại
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full transition-colors ${
                          dictationMode ? "bg-blue-500" : "bg-gray-600"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                            dictationMode ? "ml-5" : "ml-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={onFullscreen}
            className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full"
            aria-label="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

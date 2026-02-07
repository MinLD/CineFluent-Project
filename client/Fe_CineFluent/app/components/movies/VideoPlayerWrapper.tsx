"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitlePanel } from "./SubtitlePanel";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { CustomVideoControls } from "./CustomVideoControls";
import AudioPage from "./AudioPage"; // Import AudioPage
import { QuickDictionaryModal } from "./QuickDictionaryModal";
import { I_Subtitle } from "@/app/lib/types/video";
import { ArrowLeft, Flag } from "lucide-react";
import Link from "next/link";

interface VideoPlayerWrapperProps {
  video: {
    id: number;
    title: string;
    source_type?: string;
    source_url: string;
    youtube_id?: string;
    subtitles?: I_Subtitle[];
  };
}

export function VideoPlayerWrapper({ video }: VideoPlayerWrapperProps) {
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  // Settings state
  const [subtitleMode, setSubtitleMode] = useState<"both" | "en" | "off">(
    "both",
  );
  const [showSubtitlePanel, setShowSubtitlePanel] = useState(true);

  // Shadowing State
  const [shadowingSubtitle, setShadowingSubtitle] = useState<I_Subtitle | null>(
    null,
  );

  // Settings State: Quality & Subtitle Appearance
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("auto");
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: "medium", // small, medium, large
    bgOpacity: 0.9, // 0 to 1
  });

  // Handle Quality Change
  const handleQualityChange = useCallback((newQuality: string) => {
    if (playerRef.current?.setPlaybackQuality) {
      playerRef.current.setPlaybackQuality(newQuality);
      setCurrentQuality(newQuality);
    }
  }, []);

  // Update qualities periodically (YouTube API dynamic loading)
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current?.getAvailableQualityLevels) {
        const levels = playerRef.current.getAvailableQualityLevels();
        if (
          levels &&
          levels.length > 0 &&
          JSON.stringify(levels) !== JSON.stringify(qualities)
        ) {
          setQualities(levels);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [qualities]);

  // Refs
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const isInitializedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<any>(null);
  const replayTimeoutRef = useRef<any>(null); // Ref for replay timeout

  // Initialize YouTube Player
  useEffect(() => {
    if (!video.youtube_id || isInitializedRef.current) return;

    const initPlayer = () => {
      if (playerRef.current) {
        console.log("Player already initialized");
        return;
      }

      console.log("Initializing YouTube player with ID:", video.youtube_id);

      playerRef.current = new (window as any).YT.Player("youtube-player-sync", {
        height: "100%",
        width: "100%",
        videoId: video.youtube_id,
        playerVars: {
          autoplay: 0,
          controls: 0, // ❌ TẮT YouTube controls
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3, // Tắt annotations
          disablekb: 1, // Tắt keyboard shortcuts mặc định
          fs: 0, // Tắt fullscreen button mặc định
        },
        events: {
          onReady: (event: any) => {
            console.log("YouTube player ready!");
            isInitializedRef.current = true;
            // Lấy duration
            const dur = event.target.getDuration();
            setDuration(dur);
            // Set volume ban đầu
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            const YT = (window as any).YT;

            // Update isPlaying state
            setIsPlaying(event.data === YT.PlayerState.PLAYING);

            if (event.data === YT.PlayerState.PLAYING) {
              console.log("Video playing - starting time tracking");

              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }

              // Track time every 50ms
              intervalRef.current = setInterval(() => {
                if (playerRef.current?.getCurrentTime) {
                  const time = playerRef.current.getCurrentTime();
                  setCurrentTime(time);
                }
              }, 50);
            } else {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }

              if (
                event.data === YT.PlayerState.PAUSED &&
                playerRef.current?.getCurrentTime
              ) {
                setCurrentTime(playerRef.current.getCurrentTime());
              }
            }
          },
        },
      });
    };

    // Load YouTube IFrame API
    if (!(window as any).YT) {
      console.log("Loading YouTube IFrame API...");
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        console.log("YouTube IFrame API ready");
        initPlayer();
      };
    } else if ((window as any).YT.Player) {
      console.log("YouTube API already loaded, initializing player");
      initPlayer();
    }

    return () => {
      console.log("Cleaning up player");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (replayTimeoutRef.current) {
        clearTimeout(replayTimeoutRef.current);
      }
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [video.youtube_id]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  // Handle Seek
  const handleSeek = useCallback((time: number) => {
    if (!playerRef.current?.seekTo) return;
    playerRef.current.seekTo(time, true);
    setCurrentTime(time);
  }, []);

  // Handle Volume Change
  const handleVolumeChange = useCallback((newVolume: number) => {
    if (!playerRef.current?.setVolume) return;
    playerRef.current.setVolume(newVolume);
    setVolume(newVolume);
  }, []);

  // Handle Playback Rate Change
  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (!playerRef.current?.setPlaybackRate) return;
    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  // --- DICTIONARY HANDLERS ---
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    context: string;
  } | null>(null);

  const handleWordClick = useCallback((word: string, context: string) => {
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    // Clean word: remove punctuation
    const cleanWord = word.replace(/[.,!?;:"()]/g, "");
    if (cleanWord.trim().length > 0) {
      setSelectedWord({ word: cleanWord, context });
    }
  }, []);

  const closeDictionary = useCallback(() => {
    setSelectedWord(null);
  }, []);

  // Handle subtitle click
  const handleSubtitleClick = useCallback(
    (time: number) => {
      // 1. Force close modal & clear timeouts (Safe to call unconditionally)
      setShadowingSubtitle(null);
      if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);

      handleSeek(time);
      if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }
    },
    [handleSeek],
  );

  const handleShowShadowingWhenClickSub = useCallback(
    (time: number, subtitle: I_Subtitle) => {
      // 1. Force close any previous modal & clear timeouts
      setShadowingSubtitle(null);
      if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);

      // 2. Seek & Play first (Don't set shadowingSubtitle yet)
      const durationMs = (subtitle.end_time - subtitle.start_time) * 1000;

      handleSeek(time);
      if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }

      // 3. Timeout to Pause & THEN Show Modal
      replayTimeoutRef.current = setTimeout(() => {
        if (playerRef.current?.pauseVideo) {
          playerRef.current.pauseVideo();
        }
        // Shows the modal NOW, after playback is done
        setShadowingSubtitle(subtitle);
      }, durationMs + 250);
    },
    [handleSeek],
  );

  // --- SHADOWING HANDLERS ---
  const handlePracticeClick = useCallback((subtitle: I_Subtitle) => {
    // 1. Pause video
    if (playerRef.current?.pauseVideo) {
      playerRef.current.pauseVideo();
    }
    // 2. Open Modal
    setShadowingSubtitle(subtitle);
  }, []);

  const handleAudioClose = useCallback(() => {
    // Just close modal, don't force resume (let user decide or use Next)
    setShadowingSubtitle(null);
  }, []);

  const handleAudioNext = useCallback(() => {
    setShadowingSubtitle(null);
    // Resume video
    if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const handleReplayOriginal = useCallback(() => {
    if (!shadowingSubtitle) return;

    const sub = shadowingSubtitle;
    const durationMs = (sub.end_time - sub.start_time) * 1000;

    // 1. Hide modal temporarily
    setShadowingSubtitle(null);

    // 2. Seek to start
    handleSeek(sub.start_time);

    // 3. Play
    if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }

    // 4. Set timeout to pause & reopen modal
    if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);

    replayTimeoutRef.current = setTimeout(() => {
      if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      setShadowingSubtitle(sub); // Re-open
    }, durationMs + 200); // 200ms buffer
  }, [shadowingSubtitle, handleSeek]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ xử lý khi focus vào video container
      if (!containerRef.current?.contains(document.activeElement)) return;
      // Không xử lý nếu đang mở modal shadowing (để AudioPage handle nếu cần)
      if (shadowingSubtitle) return;

      switch (e.key) {
        case " ": // Space - Play/Pause
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight": // Tua tới 5s
          e.preventDefault();
          handleSeek(Math.min(currentTime + 5, duration));
          break;
        case "ArrowLeft": // Tua lùi 5s
          e.preventDefault();
          handleSeek(Math.max(currentTime - 5, 0));
          break;
        case "ArrowUp": // Tăng volume
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 10, 100));
          break;
        case "ArrowDown": // Giảm volume
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 10, 0));
          break;
        case "f":
        case "F": // Fullscreen
          e.preventDefault();
          handleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    currentTime,
    duration,
    volume,
    handlePlayPause,
    handleSeek,
    handleVolumeChange,
    handleFullscreen,
    shadowingSubtitle,
  ]);

  // Auto-hide controls
  const resetHideControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Handle mouse move to show controls
  const handleMouseMove = useCallback(() => {
    resetHideControlsTimeout();
  }, [resetHideControlsTimeout]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Video Player với Custom Controls & Subtitle Overlay */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          showSubtitlePanel ? "lg:col-span-2" : "lg:col-span-3"
        }`}
      >
        <div
          ref={containerRef}
          className="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 group max-h-[calc(100vh-200px)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
          tabIndex={0}
        >
          <VideoPlayer video={video} playerId="youtube-player-sync" />

          {/* Top Overlay Buttons */}
          <div
            className={`absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-5 bg-gradient-to-b from-black/60 to-transparent pointer-events-none transition-opacity duration-300 ease-in-out ${showControls ? "opacity-100" : "opacity-0"}`}
          >
            {/* Back Button */}
            <Link
              href="/studies/movies"
              className="inline-flex items-center gap-2 text-white hover:text-blue-400 transition-colors pointer-events-auto px-4 py-2 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Quay lại</span>
            </Link>

            {/* Report Button */}
            <button
              className="inline-flex items-center gap-2 text-white hover:text-red-400 transition-colors pointer-events-auto px-4 py-2 rounded-lg"
              aria-label="Báo lỗi"
            >
              <Flag className="w-5 h-5" />
              <span className="font-medium">Báo Lỗi</span>
            </button>
          </div>
          <span />

          {/* Subtitle Overlay */}
          <SubtitleOverlay
            subtitles={video.subtitles || []}
            currentTime={currentTime}
            subtitleMode={subtitleMode}
            onWordClick={handleWordClick}
            settings={subtitleSettings}
          />

          {/* --- SHADOWING OVERLAY --- */}
          {shadowingSubtitle && (
            <div className="absolute inset-0 z-11 flex items-center justify-center animate-fade-in">
              <AudioPage
                originalText={shadowingSubtitle.content_en}
                onClose={handleAudioClose}
                onNext={handleAudioNext}
                onReplayOriginal={handleReplayOriginal}
              />
            </div>
          )}

          {/* --- DICTIONARY MODAL OVERLAY --- */}
          {selectedWord && (
            <div className="fixed inset-0 z-[48] pointer-events-auto flex items-center justify-center">
              <QuickDictionaryModal
                word={selectedWord.word}
                context={selectedWord.context}
                onClose={closeDictionary}
              />
            </div>
          )}

          {/* Custom Controls */}
          <div
            className={`transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            <CustomVideoControls
              playerRef={playerRef}
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              volume={volume}
              playbackRate={playbackRate}
              onPlayPause={handlePlayPause}
              onSeek={handleSeek}
              onVolumeChange={handleVolumeChange}
              onPlaybackRateChange={handlePlaybackRateChange}
              onFullscreen={handleFullscreen}
              subtitleMode={subtitleMode}
              onSubtitleModeChange={setSubtitleMode}
              showSubtitlePanel={showSubtitlePanel}
              onShowSubtitlePanelChange={setShowSubtitlePanel}
              qualities={qualities}
              currentQuality={currentQuality}
              onQualityChange={handleQualityChange}
              subtitleSettings={subtitleSettings}
              onSubtitleSettingsChange={setSubtitleSettings}
            />
          </div>
        </div>
      </div>

      {/* Right: Subtitle Panel (để navigate) */}
      {showSubtitlePanel && (
        <div className="lg:col-span-1 animate-slide-in">
          <SubtitlePanel
            subtitles={video.subtitles || []}
            currentTime={currentTime}
            onSubtitleClick={handleSubtitleClick}
            onPracticeClick={handlePracticeClick}
            handleShowShadowingWhenClickSub={handleShowShadowingWhenClickSub}
          />
        </div>
      )}
    </div>
  );
}

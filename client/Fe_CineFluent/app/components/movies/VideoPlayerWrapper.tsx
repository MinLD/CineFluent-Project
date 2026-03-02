"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitlePanel } from "./SubtitlePanel";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { CustomVideoControls } from "./CustomVideoControls";
import AudioPage from "./AudioPage"; // Import AudioPage
import { QuickDictionaryModal } from "./QuickDictionaryModal";

import { DictationModal } from "./DictationModal";
import { I_Subtitle, I_Video } from "@/app/lib/types/video";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { findCurrentSubtitleIndex } from "@/app/utils/binarySearch";
import {
  ArrowLeft,
  Flag,
  Pause,
  Play,
  Loader2,
  Clock as ClockIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface VideoPlayerWrapperProps {
  video: I_Video;
}

// [FIX] Hàm trợ giúp tách ID từ URL YouTube tại Frontend
function extractYouTubeID(url: string): string | null {
  if (!url) return null;
  const pattern = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

export function VideoPlayerWrapper({ video }: VideoPlayerWrapperProps) {
  const isDrive = video.source_type === "local";
  const driveVideoRef = useRef<HTMLVideoElement>(null);

  // [FIX] Sử dụng source_url để xác định youtubeId
  const youtubeId =
    video.source_type === "youtube" ? extractYouTubeID(video.source_url) : null;

  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  // [VTT_OPTIMIZATION] Subtitles state and Active Index
  const [subtitles, setSubtitles] = useState<I_Subtitle[]>(
    video.subtitles || [],
  );
  const [activeIndex, setActiveIndex] = useState(-1);

  // Settings state
  const [subtitleMode, setSubtitleMode] = useState<"both" | "en" | "off">(
    "both",
  );
  const [showSubtitlePanel, setShowSubtitlePanel] = useState(true);
  const [isBlurred, setIsBlurred] = useState(false); // State làm mờ phụ đề (Shared State)

  // Shadowing State
  const [shadowingSubtitle, setShadowingSubtitle] = useState<I_Subtitle | null>(
    null,
  );

  const isTogglingRef = useRef(false); // Prevent rapid play/pause toggling

  // Dictation State
  const [dictationMode, setDictationMode] = useState(false);
  const [dictationSubtitle, setDictationSubtitle] = useState<I_Subtitle | null>(
    null,
  );

  // Settings State: Quality & Subtitle Appearance
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("auto");
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: "medium", // small, medium, large
    bgOpacity: 0.9, // 0 to 1
  });

  // Play/Pause Animation State
  const [playAnimation, setPlayAnimation] = useState<"play" | "pause" | null>(
    null,
  );
  const animationTimeoutRef = useRef<any>(null);

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
  const playingSegmentEndTimeRef = useRef<number | null>(null); // Ref để kiểm tra thời gian kết thúc (Double Safety)
  const activeSegmentCallbackRef = useRef<(() => void) | null>(null); // Callback khi kết thúc segment
  const safetyCheckTimeoutRef = useRef<any>(null); // Timeout để kích hoạt Double Safety sau khi seek xong
  const lastTimeRef = useRef(0);
  const lastIndexRef = useRef(-1);

  // [VTT_OPTIMIZATION] Nạp file VTT qua Web Worker
  useEffect(() => {
    if (!video.subtitle_vtt_url) return;

    const fetchAndParseVTT = async () => {
      try {
        const response = await fetch(
          `${FeApiProxyUrl}${video.subtitle_vtt_url}`,
        );
        const vttText = await response.text();

        // Khởi tạo Web Worker
        const worker = new Worker(
          new URL("@/app/utils/vtt.worker.ts", import.meta.url),
        );

        worker.onmessage = (e) => {
          if (e.data.success) {
            console.log(
              "✅ VTT Parsed via Worker:",
              e.data.subtitles.length,
              "items",
            );
            setSubtitles(e.data.subtitles);
          } else {
            console.error("❌ Worker Parse Error:", e.data.error);
          }
          worker.terminate();
        };

        worker.postMessage({ vttText });
      } catch (err) {
        console.error("❌ Failed to fetch/parse VTT:", err);
      }
    };

    fetchAndParseVTT();
  }, [video.subtitle_vtt_url]);

  // Initialize YouTube Player
  useEffect(() => {
    if (isDrive || !youtubeId || isInitializedRef.current) return;

    const initPlayer = () => {
      if (playerRef.current) {
        console.log("Player already initialized");
        return;
      }

      console.log(
        "Initializing YouTube player with ID extracted from URL:",
        youtubeId,
      );

      playerRef.current = new (window as any).YT.Player("youtube-player-sync", {
        height: "100%",
        width: "100%",
        videoId: youtubeId,
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
              setIsLoading(false);
              setHasStarted(true);
              console.log("Video playing - starting time tracking");
              // Interval is handled by unified useEffect now
            } else if (event.data === YT.PlayerState.BUFFERING) {
              setIsLoading(true);
            } else if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === (window as any).YT.PlayerState.CUED
            ) {
              setIsLoading(false);
            } else if (event.data === YT.PlayerState.UNSTARTED) {
              setHasStarted(false);
              setIsLoading(true);
            }

            // Interval cleared by unified useEffect
            if (
              event.data === YT.PlayerState.PAUSED &&
              playerRef.current?.getCurrentTime
            ) {
              setCurrentTime(playerRef.current.getCurrentTime());
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
  }, [youtubeId, isDrive]); // [FIX] Sử dụng youtubeId và isDrive làm dependencies

  // Unified Interval & Event Listeners for Drive
  useEffect(() => {
    // Handle Drive Video Events
    if (isDrive && driveVideoRef.current) {
      const vid = driveVideoRef.current;
      const onPlay = () => {
        setIsPlaying(true);
        setHasStarted(true);
        setIsLoading(false);
      };
      const onPause = () => setIsPlaying(false);
      const onWaiting = () => setIsLoading(true);
      const onPlaying = () => setIsLoading(false);
      const onCanPlay = () => setIsLoading(false);
      const onLoadedData = () => setIsLoading(false);
      const onLoadedMetadata = () => {
        if (vid) {
          setDuration(vid.duration);
          vid.volume = volume / 100;
        }
      };
      vid.addEventListener("play", onPlay);
      vid.addEventListener("pause", onPause);
      vid.addEventListener("waiting", onWaiting);
      vid.addEventListener("playing", onPlaying);
      vid.addEventListener("canplay", onCanPlay);
      vid.addEventListener("loadeddata", onLoadedData);
      vid.addEventListener("loadedmetadata", onLoadedMetadata);
      return () => {
        vid.removeEventListener("play", onPlay);
        vid.removeEventListener("pause", onPause);
        vid.removeEventListener("waiting", onWaiting);
        vid.removeEventListener("playing", onPlaying);
        vid.removeEventListener("canplay", onCanPlay);
        vid.removeEventListener("loadeddata", onLoadedData);
        vid.removeEventListener("loadedmetadata", onLoadedMetadata);
      };
    }
  }, [isDrive, volume]); // Volume dependency to init volume

  // Unified Interval for Time Tracking & Double Safety
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        let time = 0;
        // Get Time
        if (isDrive && driveVideoRef.current) {
          time = driveVideoRef.current.currentTime;
        } else if (playerRef.current?.getCurrentTime) {
          time = playerRef.current.getCurrentTime();
        }
        setCurrentTime(time);

        // [VTT_OPTIMIZATION] Decoupled Index Calculation
        // Chỉ cập nhật activeIndex khi thực sự bước sang câu mới
        if (subtitles.length > 0) {
          const newIndex = findCurrentSubtitleIndex(subtitles, time);
          if (newIndex !== lastIndexRef.current) {
            setActiveIndex(newIndex);
            lastIndexRef.current = newIndex;
          }
        }

        // --- DOUBLE SAFETY CHECK ---
        if (
          playingSegmentEndTimeRef.current &&
          time >= playingSegmentEndTimeRef.current
        ) {
          // Pause
          if (isDrive && driveVideoRef.current) driveVideoRef.current.pause();
          else if (playerRef.current?.pauseVideo)
            playerRef.current.pauseVideo();

          playingSegmentEndTimeRef.current = null;
          if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);

          if (activeSegmentCallbackRef.current) {
            activeSegmentCallbackRef.current();
            activeSegmentCallbackRef.current = null;
          }
        }
      }, 50);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, isDrive]);

  // Handle Play/Pause
  const handlePlayPause = useCallback(() => {
    if (isDrive && driveVideoRef.current) {
      if (driveVideoRef.current.paused) driveVideoRef.current.play();
      else driveVideoRef.current.pause();
      return;
    }

    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, isDrive]);

  // Handle Seek
  const handleSeek = useCallback(
    (time: number) => {
      if (isDrive && driveVideoRef.current) {
        driveVideoRef.current.currentTime = time;
        setCurrentTime(time);
        return;
      }
      if (!playerRef.current?.seekTo) return;
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
      console.log("Seek to: ", time);
    },
    [isDrive],
  );

  // Handle Volume Change
  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (isDrive && driveVideoRef.current) {
        driveVideoRef.current.volume = newVolume / 100;
        setVolume(newVolume);
        return;
      }
      if (!playerRef.current?.setVolume) return;
      playerRef.current.setVolume(newVolume);
      setVolume(newVolume);
    },
    [isDrive],
  );

  // Handle Playback Rate Change
  const handlePlaybackRateChange = useCallback(
    (rate: number) => {
      if (isDrive && driveVideoRef.current) {
        driveVideoRef.current.playbackRate = rate;
        setPlaybackRate(rate);
        return;
      }
      if (!playerRef.current?.setPlaybackRate) return;
      playerRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    },
    [isDrive],
  );

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
  const handleVideoClick = useCallback(() => {
    // Prevent if modals are open
    if (shadowingSubtitle || dictationSubtitle || selectedWord) return;

    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);

    // Set animation based on current state (if playing, we are about to pause)
    setPlayAnimation(isPlaying ? "pause" : "play");

    // Toggle play/pause
    handlePlayPause();

    animationTimeoutRef.current = setTimeout(() => {
      setPlayAnimation(null);
    }, 600);
  }, [
    isPlaying,
    handlePlayPause,
    shadowingSubtitle,
    dictationSubtitle,
    selectedWord,
  ]);

  const handleWordClick = useCallback((word: string, context: string) => {
    if (isDrive && driveVideoRef.current) driveVideoRef.current.pause();
    else if (playerRef.current?.pauseVideo) {
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
      if (safetyCheckTimeoutRef.current)
        clearTimeout(safetyCheckTimeoutRef.current);
      playingSegmentEndTimeRef.current = null;
      activeSegmentCallbackRef.current = null;

      handleSeek(time);
      if (isDrive && driveVideoRef.current) driveVideoRef.current.play();
      else if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }
    },
    [handleSeek, isDrive],
  );

  // --- REUSABLE PLAYBACK LOGIC ---
  const playSegmentAndThen = useCallback(
    (subtitle: I_Subtitle, onComplete: () => void, bufferMs: number = 150) => {
      // 1. Clear existing timeout
      if (replayTimeoutRef.current) clearTimeout(replayTimeoutRef.current);
      if (safetyCheckTimeoutRef.current)
        clearTimeout(safetyCheckTimeoutRef.current);

      const durationMs = (subtitle.end_time - subtitle.start_time) * 1000;

      // 2. Clear old state immediately
      playingSegmentEndTimeRef.current = null;
      activeSegmentCallbackRef.current = onComplete; // Store callback

      // 3. Seek to start
      handleSeek(subtitle.start_time);

      // 4. Play
      if (isDrive && driveVideoRef.current) driveVideoRef.current.play();
      else if (playerRef.current?.playVideo) {
        playerRef.current.playVideo();
      }

      // 5. Activate Double Safety Check after 500ms (to skip seeking lag)
      safetyCheckTimeoutRef.current = setTimeout(() => {
        playingSegmentEndTimeRef.current = subtitle.end_time;
      }, 800);

      // 5. Set timeout to Pause & Execute Callback
      replayTimeoutRef.current = setTimeout(() => {
        if (isDrive && driveVideoRef.current) driveVideoRef.current.pause();
        else if (playerRef.current?.pauseVideo) {
          playerRef.current.pauseVideo();
        }
        playingSegmentEndTimeRef.current = null; // Reset ref

        // Gọi callback (nếu chưa được gọi bởi Interval)
        if (activeSegmentCallbackRef.current) {
          activeSegmentCallbackRef.current();
          activeSegmentCallbackRef.current = null;
        }
      }, durationMs + bufferMs);
    },
    [handleSeek],
  );

  // --- SHADOWING HANDLERS ---
  const handlePracticeClick = useCallback((subtitle: I_Subtitle) => {
    // 1. Pause video
    if (isDrive && driveVideoRef.current) driveVideoRef.current.pause();
    else if (playerRef.current?.pauseVideo) {
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
    if (isDrive && driveVideoRef.current) driveVideoRef.current.play();
    else if (playerRef.current?.playVideo) {
      playerRef.current.playVideo();
    }
  }, []);

  const handleReplayOriginal = useCallback(() => {
    if (!shadowingSubtitle) return;
    // Hide modal -> Play segment -> Show modal
    setShadowingSubtitle(null);
    playSegmentAndThen(shadowingSubtitle, () => {
      setShadowingSubtitle(shadowingSubtitle);
    });
  }, [shadowingSubtitle, playSegmentAndThen]);

  const handleShowShadowingWhenClickSub = useCallback(
    (time: number, subtitle: I_Subtitle) => {
      // Force close any previous modal
      setShadowingSubtitle(null);

      // Play segment -> Show modal
      // Note: "time" arg is ignored in favor of subtitle.start_time in helper
      playSegmentAndThen(subtitle, () => {
        setShadowingSubtitle(subtitle);
      });
    },
    [playSegmentAndThen],
  );

  // Handle Dictation Click from Panel
  const handleDictationClick = useCallback(
    (subtitle: I_Subtitle) => {
      // Force close any previous dictation to reset
      setDictationSubtitle(null);

      // Play segment -> Show Dictation Modal
      playSegmentAndThen(subtitle, () => {
        setDictationSubtitle(subtitle);
        setIsBlurred(true);
      });
    },
    [playSegmentAndThen],
  );
  const handleReplayVideo = useCallback(
    (subtitle: I_Subtitle) => {
      // Force close any previous dictation to reset

      // Play segment -> Show Dictation Modal
      playSegmentAndThen(subtitle, () => {});
    },
    [playSegmentAndThen],
  );

  const handleDictationNext = useCallback(() => {
    if (!dictationSubtitle || !video.subtitles) return;
    const currentIndex = video.subtitles.findIndex(
      (s) => s.id === dictationSubtitle.id,
    );
    if (currentIndex !== -1 && currentIndex < video.subtitles.length - 1) {
      const nextSubtitle = video.subtitles[currentIndex + 1];
      handleDictationClick(nextSubtitle);
    } else {
      // Hết bài -> Đóng modal và phát tiếp
      setDictationSubtitle(null);
      if (isDrive && driveVideoRef.current) driveVideoRef.current.play();
      else if (playerRef.current) playerRef.current.playVideo();
    }
  }, [dictationSubtitle, video.subtitles, handleDictationClick]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ xử lý khi focus vào video container
      if (!containerRef.current?.contains(document.activeElement)) return;
      // Không xử lý nếu đang mở modal shadowing (để AudioPage handle nếu cần)
      if (shadowingSubtitle || dictationSubtitle) return;

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
    dictationSubtitle,
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
    <div className="grid grid-cols-1 lg:grid-cols-3">
      {/* Left: Video Player với Custom Controls & Subtitle Overlay */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          showSubtitlePanel ? "lg:col-span-2" : "lg:col-span-3"
        }`}
      >
        <div
          ref={containerRef}
          className="relative bg-slate-900 overflow-hidden group max-h-[calc(100vh)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
          tabIndex={0}
        >
          <VideoPlayer
            ref={driveVideoRef}
            video={video}
            playerId="youtube-player-sync"
          />

          {/* Phase 1: Màn hình Poster ban đầu (Backdrop + Large Loader) */}
          {!hasStarted && (
            <div className="absolute inset-0 z-[30] flex flex-col items-center justify-center bg-black">
              {video.backdrop_url && (
                <div className="absolute inset-0">
                  <Image
                    src={video.backdrop_url}
                    alt={video.title}
                    fill
                    className="object-cover opacity-60"
                  />
                </div>
              )}

              <div className="relative z-10 text-center">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-16 h-16 text-black animate-spin" />
                  </div>
                ) : (
                  <button
                    onClick={handleVideoClick}
                    className="group/play flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40 ">
                      <Play className="w-10 h-10 text-white fill-white ml-1" />
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phase 2: Vòng xoay khi video bị lag/buffering lúc đang xem */}
          {hasStarted && isLoading && (
            <div className="absolute inset-0 z-[30] flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-3">
                <Loader2 className="w-10 h-10 text-black animate-spin" />
              </div>
            </div>
          )}

          {/* Click Overlay for Showing Controls Only (Not Pausing) */}
          <div
            className="absolute inset-0 z-[10] cursor-pointer"
            onClick={() => {
              if (showControls) {
                setShowControls(false);
              } else {
                resetHideControlsTimeout();
              }
            }}
            onDoubleClick={handleFullscreen}
          />

          {/* Top Overlay Buttons */}
          <div
            className={`absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-[25] bg-gradient-to-b from-black/60 to-transparent pointer-events-none transition-opacity duration-300 ease-in-out ${showControls ? "opacity-100" : "opacity-0"}`}
          >
            {/* Back Button */}
            <Link
              href="/studies/movies"
              className="inline-flex items-center gap-1.5 md:gap-2 text-white hover:text-blue-400 transition-colors pointer-events-auto px-2 md:px-4 py-1.5 md:py-2 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base font-medium">Quay lại</span>
            </Link>
          </div>
          <span />

          {/* Play/Pause Animation Icon */}
          {playAnimation && (
            <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 backdrop-blur-sm p-6 rounded-full animate-ping-short flex items-center justify-center">
                {playAnimation === "play" ? (
                  <Play className="w-12 h-12 text-white fill-white" />
                ) : (
                  <Pause className="w-12 h-12 text-white fill-white" />
                )}
              </div>
            </div>
          )}

          {/* Subtitle Overlay */}
          <SubtitleOverlay
            subtitles={subtitles}
            activeIndex={activeIndex}
            currentTime={currentTime}
            subtitleMode={subtitleMode}
            onWordClick={handleWordClick}
            settings={subtitleSettings}
            isBlurred={isBlurred}
            showControls={showControls}
            showSubtitlePanel={showSubtitlePanel}
          />

          {/* --- SHADOWING OVERLAY --- */}
          {shadowingSubtitle && (
            <div className="absolute inset-0 z-[50] flex items-center justify-center animate-fade-in">
              <AudioPage
                originalText={shadowingSubtitle.content_en}
                onClose={() => {
                  setShadowingSubtitle(null);
                  if (replayTimeoutRef.current)
                    clearTimeout(replayTimeoutRef.current);
                  playingSegmentEndTimeRef.current = null;
                  activeSegmentCallbackRef.current = null;
                }}
                onNext={handleAudioNext}
                onReplayOriginal={handleReplayOriginal}
              />
            </div>
          )}

          {/* --- DICTATION MODAL OVERLAY --- */}
          {dictationSubtitle && (
            <DictationModal
              subtitle={dictationSubtitle}
              onClose={() => {
                setDictationSubtitle(null);
                if (replayTimeoutRef.current)
                  clearTimeout(replayTimeoutRef.current);
                if (safetyCheckTimeoutRef.current)
                  clearTimeout(safetyCheckTimeoutRef.current);
                playingSegmentEndTimeRef.current = null;
                activeSegmentCallbackRef.current = null;
                if (isDrive && driveVideoRef.current)
                  driveVideoRef.current.play();
                else if (playerRef.current) playerRef.current.playVideo();
              }}
              onReplay={() => handleReplayVideo(dictationSubtitle)}
              onNext={handleDictationNext}
            />
          )}

          {/* --- DICTIONARY MODAL OVERLAY --- */}
          {selectedWord && (
            <QuickDictionaryModal
              word={selectedWord.word}
              context={selectedWord.context}
              onClose={closeDictionary}
            />
          )}

          {/* Custom Controls (Inside for Fullscreen) */}
          <div
            className={`absolute bottom-0 left-0 right-0 z-[40] transition-opacity duration-300 ease-in-out ${
              showControls
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <CustomVideoControls
              videoId={video.id}
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

        {/* Custom Controls (Inside Container for Fullscreen support) */}
        {/* Note: Moved inside containerRef and added absolute positioning */}
      </div>

      {/* Right: Subtitle Panel (để navigate) */}
      {showSubtitlePanel && (
        <div className="z-[50] lg:col-span-1 animate-slide-in h-0 min-h-full">
          <SubtitlePanel
            subtitles={subtitles}
            activeIndex={activeIndex}
            currentTime={currentTime}
            onSubtitleClick={handleSubtitleClick}
            onPracticeClick={handlePracticeClick}
            handleShowShadowingWhenClickSub={handleShowShadowingWhenClickSub}
            onWordClick={handleWordClick}
            onDictationClick={handleDictationClick}
            onClose={() => setShowSubtitlePanel(false)}
            isBlurred={isBlurred}
            onToggleBlur={() => setIsBlurred(!isBlurred)}
          />
        </div>
      )}
    </div>
  );
}

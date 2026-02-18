"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitlePanel } from "./SubtitlePanel";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { CustomVideoControls } from "./CustomVideoControls";
import AudioPage from "./AudioPage"; // Import AudioPage
import { QuickDictionaryModal } from "./QuickDictionaryModal";

import { DictationModal } from "./DictationModal";
import { I_Subtitle } from "@/app/lib/types/video";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { ArrowLeft, Flag } from "lucide-react";
import Link from "next/link";

interface VideoPlayerWrapperProps {
  video: {
    id: number;
    title: string;
    source_type?: string;
    source_url: string;
    youtube_id?: string;
    imdb_id?: string;
    subtitles?: I_Subtitle[];
  };
}

export function VideoPlayerWrapper({ video }: VideoPlayerWrapperProps) {
  const isDrive = video.source_type === "drive";
  // const isDrive = true; // FORCE DRIVE FOR TESTING
  const driveVideoRef = useRef<HTMLVideoElement>(null);

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

  // Initialize YouTube Player
  useEffect(() => {
    if (isDrive || !video.youtube_id || isInitializedRef.current) return;

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
              // Interval is handled by unified useEffect now
            } else {
              // Interval cleared by unified useEffect
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

  // Unified Interval & Event Listeners for Drive
  useEffect(() => {
    // Handle Drive Video Events
    if (isDrive && driveVideoRef.current) {
      const vid = driveVideoRef.current;
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onLoadedMetadata = () => {
        if (vid) {
          setDuration(vid.duration);
          vid.volume = volume / 100;
        }
      };
      vid.addEventListener("play", onPlay);
      vid.addEventListener("pause", onPause);
      vid.addEventListener("loadedmetadata", onLoadedMetadata);
      return () => {
        vid.removeEventListener("play", onPlay);
        vid.removeEventListener("pause", onPause);
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
          className="relative bg-slate-900 overflow-hidden group max-h-[calc(100vh-200px)]"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
          tabIndex={0}
        >
          {isDrive ? (
            /* DRIVE PLAYER (HTML5) */
            <div className="relative w-full aspect-video bg-black">
              <video
                ref={driveVideoRef}
                src={
                  isDrive
                    ? `${FeApiProxyUrl}/videos/stream/drive/${video.source_url}`
                    : video.source_url
                }
                className="w-full h-full"
                controls={false} // Custom controls only
                playsInline
              />
            </div>
          ) : (
            <VideoPlayer video={video} playerId="youtube-player-sync" />
          )}

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
            isBlurred={isBlurred}
          />

          {/* --- SHADOWING OVERLAY --- */}
          {shadowingSubtitle && (
            <div className="absolute inset-0 z-[11] flex items-center justify-center animate-fade-in">
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
        </div>

        {/* Custom Controls (Outside & Below Video) */}
        <div className="w-full bg-slate-900 border-t border-slate-700/50 relative z-[11]">
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

      {/* Right: Subtitle Panel (để navigate) */}
      {showSubtitlePanel && (
        <div className="lg:col-span-1 animate-slide-in h-0 min-h-full">
          <SubtitlePanel
            subtitles={video.subtitles || []}
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

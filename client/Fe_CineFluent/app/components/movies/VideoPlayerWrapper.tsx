"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { VideoPlayer } from "./VideoPlayer";
import { SubtitlePanel } from "./SubtitlePanel";
import { SubtitleOverlay } from "./SubtitleOverlay";
import { CustomVideoControls } from "./CustomVideoControls";
import AudioPage from "./AudioPage"; // Import AudioPage
import { QuickDictionaryModal } from "./QuickDictionaryModal";
import { AdaptiveClozeModal } from "./AdaptiveClozeModal";
import { DictationModal } from "./DictationModal";
import { I_Subtitle, I_Video } from "@/app/lib/types/video";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { findCurrentSubtitleIndex } from "@/app/utils/binarySearch";
import { predictKtAction, updateKtStateAction } from "@/app/lib/actions/kt_actions";
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
import { saveWatchHistoryAction } from "@/app/lib/actions/videos";

interface VideoPlayerWrapperProps {
  video: I_Video;
}

// [FIX] HÃ m trá»£ giÃºp tÃ¡ch ID tá»« URL YouTube táº¡i Frontend
function extractYouTubeID(url: string): string | null {
  if (!url) return null;
  const pattern = /(?:v=|\/)([0-9A-Za-z_-]{11}).*/;
  const match = url.match(pattern);
  return match ? match[1] : null;
}

export function VideoPlayerWrapper({ video }: VideoPlayerWrapperProps) {
  const isDrive = video.source_type === "local";
  const driveVideoRef = useRef<HTMLVideoElement>(null);
  const aiAnalysisStatus = video.ai_analysis?.status;

  // [FIX] Sá»­ dá»¥ng source_url Ä‘á»ƒ xÃ¡c Ä‘á»‹nh youtubeId
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
  const [isBlurred, setIsBlurred] = useState(false); // State lÃ m má» phá»¥ Ä‘á» (Shared State)

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

  // [DKT] Cloze Test State
  const [clozeSubtitle, setClozeSubtitle] = useState<{ subtitle: I_Subtitle, targetTagId: number } | null>(null);
  const predictedTagsRef = useRef<Set<number>>(new Set());
  const pendingClozeRef = useRef<{ subtitle: I_Subtitle, targetTagId: number } | null>(null);
  const isDktEnabledRef = useRef<boolean>(true); // Phao cá»©u sinh: Táº¯t AI náº¿u user chÆ°a Ä‘Äƒng nháº­p (401)

  const learningQuizEnabledRef = useRef<boolean>(false);
  const learningQuizRequestTokenRef = useRef<number>(0);

  // Quick Dictionary State
  const [selectedWord, setSelectedWord] = useState<{
    word: string;
    context: string;
  } | null>(null);

  // Settings State: Quality & Subtitle Appearance
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<string>("auto");
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: "medium", // small, medium, large
    bgOpacity: 0.9, // 0 to 1
    learningQuizEnabled: false,
  });
  const isLearningQuizEnabled =
    subtitleSettings.learningQuizEnabled && aiAnalysisStatus === "READY";

  useEffect(() => {
    learningQuizEnabledRef.current = isLearningQuizEnabled;
    learningQuizRequestTokenRef.current += 1;

    if (isLearningQuizEnabled) {
      return;
    }

    pendingClozeRef.current = null;
    predictedTagsRef.current.clear();
    setClozeSubtitle(null);
    setIsBlurred(false);
  }, [isLearningQuizEnabled]);

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
  const playingSegmentEndTimeRef = useRef<number | null>(null); // Ref Ä‘á»ƒ kiá»ƒm tra thá»i gian káº¿t thÃºc (Double Safety)
  const activeSegmentCallbackRef = useRef<(() => void) | null>(null); // Callback khi káº¿t thÃºc segment
  const safetyCheckTimeoutRef = useRef<any>(null); // Timeout Ä‘á»ƒ kÃ­ch hoáº¡t Double Safety sau khi seek xong
  const lastTimeRef = useRef(0);
  const lastIndexRef = useRef(-1);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  // [VTT_OPTIMIZATION] Náº¡p file VTT qua Web Worker
  useEffect(() => {
    if (!video.subtitle_vtt_url) return;

    const fetchAndParseVTT = async () => {
      try {
        const response = await fetch(
          `${FeApiProxyUrl}${video.subtitle_vtt_url}`,
        );
        const vttText = await response.text();

        // Khá»Ÿi táº¡o Web Worker
        const worker = new Worker(
          new URL("@/app/utils/vtt.worker.ts", import.meta.url),
        );

        worker.onmessage = (e) => {
          if (e.data.success) {
            console.log(
              "âœ… VTT Parsed via Worker:",
              e.data.subtitles.length,
              "items",
            );

            setSubtitles(e.data.subtitles);
          } else {
            console.error("âŒ Worker Parse Error:", e.data.error);
          }
          worker.terminate();
        };

        worker.postMessage({ vttText });
      } catch (err) {
        console.error("âŒ Failed to fetch/parse VTT:", err);
      }
    };

    fetchAndParseVTT();
  }, [video.subtitle_vtt_url]);

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
      // [PROGRESS] Save on pause - using refs to ensure latest values
      saveWatchHistoryAction(video.id, {
        last_position: currentTimeRef.current,
        duration: durationRef.current,
      });
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, isDrive, video.id]);

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
  const handleVideoClick = useCallback(() => {
    // Prevent if modals are open
    if (shadowingSubtitle || dictationSubtitle || selectedWord || clozeSubtitle) return;

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

  const handleWordClick = useCallback(
    (word: string, context: string) => {
      if (isDrive && driveVideoRef.current) driveVideoRef.current.pause();
      else if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      // Clean word: remove punctuation
      const cleanWord = word.replace(/[.,!?;:"()]/g, "");
      if (cleanWord.trim().length > 0) {
        setSelectedWord({ word: cleanWord, context });
      }
    },
    [isDrive],
  );

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

        // Gá»i callback (náº¿u chÆ°a Ä‘Æ°á»£c gá»i bá»Ÿi Interval)
        if (activeSegmentCallbackRef.current) {
          activeSegmentCallbackRef.current();
          activeSegmentCallbackRef.current = null;
        }
      }, durationMs + bufferMs);
    },
    [handleSeek, isDrive],
  );

  // --- SHADOWING HANDLERS ---
  const handlePracticeClick = useCallback(
    (subtitle: I_Subtitle) => {
      // 1. Pause video
      if (isDrive && driveVideoRef.current) driveVideoRef.current.pause();
      else if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      // 2. Open Modal
      setShadowingSubtitle(subtitle);
    },
    [isDrive],
  );

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
  }, [isDrive]);

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
      // Háº¿t bÃ i -> ÄÃ³ng modal vÃ  phÃ¡t tiáº¿p
      setDictationSubtitle(null);
      if (isDrive && driveVideoRef.current) driveVideoRef.current.play();
      else if (playerRef.current) playerRef.current.playVideo();
    }
  }, [dictationSubtitle, video.subtitles, handleDictationClick, isDrive]);

  // Record watch history on mount & Handle Auto-Resume
  useEffect(() => {
    if (video.id) {
      saveWatchHistoryAction(video.id);
    }
  }, [video.id]);

  // Handle Resume Position
  const hasResumedRef = useRef(false);
  useEffect(() => {
    if (
      hasStarted &&
      !hasResumedRef.current &&
      video.user_history?.last_position
    ) {
      const lastPos = video.user_history.last_position;
      // TrÃ¡nh resume náº¿u Ä‘Ã£ á»Ÿ gáº§n cuá»‘i phim (>95%)
      if (
        video.user_history.duration &&
        lastPos / video.user_history.duration < 0.95
      ) {
        console.log("Resuming from last position:", lastPos);
        handleSeek(lastPos);
      }
      hasResumedRef.current = true;
    }
  }, [hasStarted, video.user_history, handleSeek]);

  // Heartbeat Progress Sync (Every 30 seconds)
  useEffect(() => {
    if (!isPlaying || !video.id) return;

    const heartbeatInterval = setInterval(() => {
      // Use refs to get absolute latest values without effect dependency
      if (currentTimeRef.current > 0) {
        saveWatchHistoryAction(video.id, {
          last_position: currentTimeRef.current,
          duration: durationRef.current,
        });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isPlaying, video.id]); // Removed currentTime and duration from dependencies

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
          controls: 0, // âŒ Táº®T YouTube controls
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3, // Táº¯t annotations
          disablekb: 1, // Táº¯t keyboard shortcuts máº·c Ä‘á»‹nh
          fs: 0, // Táº¯t fullscreen button máº·c Ä‘á»‹nh
        },
        events: {
          onReady: (event: any) => {
            console.log("YouTube player ready!");
            isInitializedRef.current = true;
            // Láº¥y duration
            const dur = event.target.getDuration();
            setDuration(dur);
            durationRef.current = dur;
            // Set volume ban Ä‘áº§u
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
  }, [youtubeId, isDrive]); // [FIX] Sá»­ dá»¥ng youtubeId vÃ  isDrive lÃ m dependencies

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
          const dur = vid.duration;
          setDuration(dur);
          durationRef.current = dur;
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
        currentTimeRef.current = time;

        // [VTT_OPTIMIZATION] Decoupled Index Calculation
        // Chá»‰ cáº­p nháº­t activeIndex khi thá»±c sá»± bÆ°á»›c sang cÃ¢u má»›i
        if (subtitles.length > 0) {
          const newIndex = findCurrentSubtitleIndex(subtitles, time);
          if (newIndex !== lastIndexRef.current) {
            setActiveIndex(newIndex);
            lastIndexRef.current = newIndex;
          }

          // --- [DKT LOOK AHEAD LOGIC] ---
          const nextIndex = newIndex !== -1 ? newIndex + 1 : 0;
          if (
            nextIndex < subtitles.length &&
            isDktEnabledRef.current &&
            isLearningQuizEnabled
          ) {
              const nextSub = subtitles[nextIndex];
              const timeUntilNext = nextSub.start_time - time;

              // Náº¿u cÃ¢u tiáº¿p theo náº±m trong vÃ²ng 4 giÃ¢y vÃ  cÃ³ Grammar Tag thá»±c tá»« AI
              if (
                 nextSub.grammar_tag_id !== undefined && nextSub.grammar_tag_id !== null &&
                 timeUntilNext > 0 && timeUntilNext <= 4.0 &&
                 !predictedTagsRef.current.has(nextSub.id)
              ) {
                  predictedTagsRef.current.add(nextSub.id); // ÄÃ¡nh dáº¥u Ä‘Ã£ fetch

                  // Gá»i API Predict báº±ng Server Action (Gá»­i tag tháº­t cá»§a cÃ¢u)
                  const requestToken = learningQuizRequestTokenRef.current;
                  predictKtAction([nextSub.grammar_tag_id]).then(res => {
                     if (
                       requestToken !== learningQuizRequestTokenRef.current ||
                       !learningQuizEnabledRef.current
                     ) {
                       return;
                     }

                     if (res.success && res.data && res.data.target_tag_to_cloze !== null && nextSub.cloze_data) {
                         console.log("ðŸ”¥ AI DKT Má»‡nh Lá»‡nh: Äá»¥c lá»— tháº»", res.data.target_tag_to_cloze, "á»Ÿ cÃ¢u", nextSub.id);
                         pendingClozeRef.current = { subtitle: nextSub, targetTagId: res.data.target_tag_to_cloze };
                     } else if (res.success) {
                         console.log("ðŸŒŸ AI phÃ¡n: Báº¡n Ä‘Ã£ náº¯m vá»¯ng thÃ¬ nÃ y, khÃ´ng cáº§n Ä‘á»¥c lá»—.");
                     } else if (res.status === 401) {
                         console.warn("User chÆ°a Ä‘Äƒng nháº­p, táº¯t luá»“ng AI DKT.");
                         isDktEnabledRef.current = false;
                     }
                  }).catch(err => console.error("DKT Action Error", err));
              }

              // TIáº¾N HÃ€NH Äá»¤C Lá»– KHI Äáº¾N Táº¬N NÆ I (Náº¿u AI yÃªu cáº§u)
              if (pendingClozeRef.current && time >= pendingClozeRef.current.subtitle.start_time) {
                  const clozeData = pendingClozeRef.current;
                  pendingClozeRef.current = null; // XÃ³a trigger

                  // Dá»«ng video ngay láº­p tá»©c
                  if (isDrive && driveVideoRef.current) driveVideoRef.current.pause();
                  else if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();

                  setClozeSubtitle({ subtitle: clozeData.subtitle, targetTagId: clozeData.targetTagId });
                  setIsBlurred(true);
              }
          }
          // --- END DKT LOGIC ---

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
  }, [isPlaying, isDrive, isLearningQuizEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chá»‰ xá»­ lÃ½ khi focus vÃ o video container
      if (!containerRef.current?.contains(document.activeElement)) return;
      // KhÃ´ng xá»­ lÃ½ náº¿u Ä‘ang má»Ÿ modal shadowing (Ä‘á»ƒ AudioPage handle náº¿u cáº§n)
      if (shadowingSubtitle || dictationSubtitle) return;

      switch (e.key) {
        case " ": // Space - Play/Pause
          e.preventDefault();
          handlePlayPause();
          break;
        case "ArrowRight": // Tua tá»›i 5s
          e.preventDefault();
          handleSeek(Math.min(currentTime + 5, duration));
          break;
        case "ArrowLeft": // Tua lÃ¹i 5s
          e.preventDefault();
          handleSeek(Math.max(currentTime - 5, 0));
          break;
        case "ArrowUp": // TÄƒng volume
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 10, 100));
          break;
        case "ArrowDown": // Giáº£m volume
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
      {/* Left: Video Player vá»›i Custom Controls & Subtitle Overlay */}
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

          {/* DKT TÆ°Æ¡ng tÃ¡c - Äá»¥c lá»— báº±ng AI */}
          {clozeSubtitle && (
            <AdaptiveClozeModal
              subtitle={clozeSubtitle.subtitle}
              targetTagId={clozeSubtitle.targetTagId}
              onResult={(tagId, isCorrect) => {
                 // ÄÃ³ng Modal
                 setClozeSubtitle(null);
                 setIsBlurred(false);

                 // Cháº¡y láº¡i video
                 if (isDrive && driveVideoRef.current) driveVideoRef.current.play();
                 else if (playerRef.current?.playVideo) playerRef.current.playVideo();

                 // Náº¡p bá»™ nÃ£o qua Server Action
                 updateKtStateAction(tagId, isCorrect).then(res => {
                    if (res.success) {
                       console.log("Cáº­p nháº­t nÃ£o DKT thÃ nh cÃ´ng! Mastery má»›i:", res.data?.new_mastery);
                    }
                 }).catch(err => console.error("Lá»—i cáº­p nháº­t DKT Action:", err));
              }}
            />
          )}

          {/* Phase 1: MÃ n hÃ¬nh Poster ban Ä‘áº§u (Backdrop + Large Loader) */}
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

          {/* Phase 2: VÃ²ng xoay khi video bá»‹ lag/buffering lÃºc Ä‘ang xem */}
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
              <span className="text-sm md:text-base font-medium">Quay láº¡i</span>
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
              videoId={video.id}
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
              onSubtitleSettingsChange={(settings) =>
                setSubtitleSettings({
                  ...settings,
                  learningQuizEnabled: settings.learningQuizEnabled ?? false,
                })
              }
            />
          </div>
        </div>

        {/* Custom Controls (Inside Container for Fullscreen support) */}
        {/* Note: Moved inside containerRef and added absolute positioning */}
      </div>

      {/* Right: Subtitle Panel (Ä‘á»ƒ navigate) */}
      {showSubtitlePanel && (
        <div className="z-[50] lg:col-span-1 animate-slide-in h-0 min-h-full">
          <SubtitlePanel
            subtitles={subtitles}
            currentTime={currentTime}
            activeIndex={activeIndex}
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

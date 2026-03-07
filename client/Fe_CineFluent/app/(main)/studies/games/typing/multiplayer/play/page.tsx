"use client";

import { Suspense, useEffect, useState, useContext } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/app/lib/context/SocketContext";
import { AuthContext } from "@/app/lib/context/AuthContext";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { Trophy, Users, LayoutGrid, Loader2 } from "lucide-react";
import TypingEngine from "@/app/components/game/typing/TypingEngine";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TypingStage {
  id: number;
  chapter_number: number;
  content: string;
  difficulty: string;
}

function GamePlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get("room");
  const mapId = searchParams.get("map_id");

  const auth = useContext(AuthContext);
  const username = auth?.profile_user?.profile?.fullname || "Guest";

  const [stages, setStages] = useState<TypingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const [gameState, setGameState] = useState<
    "countdown" | "playing" | "results"
  >("countdown");
  const [countdown, setCountdown] = useState(3);

  const [players, setPlayers] = useState<
    Record<
      string,
      { username: string; progress: number; wpm: number; isFinished: boolean }
    >
  >({});

  useEffect(() => {
    if (!roomCode || !mapId) {
      toast.error("Thiếu thông tin phòng!");
      router.push("/studies/games/typing");
      return;
    }

    const fetchStages = async () => {
      try {
        const res = await fetch(
          `${FeApiProxyUrl}/typing-game/maps/${mapId}/stages`,
        );
        const data = await res.json();
        if (data.code === 200) setStages(data.data);
      } catch (e) {
        console.error("Lỗi lấy data bài gõ", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStages();
  }, [mapId, roomCode, router]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) {
      // Don't push immediately, just wait for socket to connect
      return;
    }

    const handleProgressUpdate = (data: any) => {
      setPlayers((prev) => ({
        ...prev,
        [data.sid]: {
          username: data.username,
          progress: data.progress,
          wpm: data.wpm,
          isFinished: data.progress >= 100,
        },
      }));
    };

    socket.on("player_progress_updated", handleProgressUpdate);

    return () => {
      socket.off("player_progress_updated", handleProgressUpdate);
    };
  }, [socket]); // remove router from deps to prevent unnecessary cycles

  useEffect(() => {
    if (gameState === "countdown" && !loading) {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState("playing");
      }
    }
  }, [countdown, gameState, loading]);

  const handleProgress = (progress: number, wpm: number) => {
    if (socket) {
      socket.emit("typing_update_progress", { progress, wpm });
    }
  };

  const handleStageComplete = (stats: { wpm: number; accuracy: number }) => {
    handleProgress(100, stats.wpm);
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
    } else {
      setGameState("results");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#020617] flex justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  if (!stages.length)
    return (
      <div className="min-h-screen bg-[#020617] text-white p-20 text-center">
        Bản đồ này không có nội dung.
      </div>
    );

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col font-sans">
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col pt-24">
        {/* Header - Track */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 relative">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Đường đua Multiplayer
            - Phòng: {roomCode}
          </h2>

          <div className="space-y-4">
            {Object.entries(players).map(([sid, player]) => (
              <div key={sid} className="relative">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="font-bold text-slate-200">
                    {player.username} {sid === socket?.id ? "(Bạn)" : ""}
                  </span>
                  <span>
                    {Math.round(player.progress)}% • {player.wpm} WPM
                  </span>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out ${sid === socket?.id ? "bg-gradient-to-r from-purple-500 to-indigo-500" : "bg-gradient-to-r from-slate-600 to-slate-500"}`}
                    style={{ width: `${player.progress}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Fake progress for our own avatar when others haven't typed or we haven't typed */}
            {!players[socket?.id || ""] && (
              <div className="relative">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="font-bold text-purple-400">
                    {username} (Bạn)
                  </span>
                  <span>0%</span>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700"></div>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div className="flex-1 flex flex-col relative bg-slate-900 border border-slate-800 rounded-3xl p-8 overflow-hidden">
          <AnimatePresence mode="wait">
            {gameState === "countdown" && (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-50 text-white font-black text-8xl"
              >
                {countdown}
              </motion.div>
            )}

            {gameState === "playing" && (
              <motion.div
                key={`stage-${stages[currentStageIndex].id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-center"
              >
                <div className="text-center mb-8">
                  <span className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded-full text-sm font-semibold border border-slate-700">
                    Chương {stages[currentStageIndex].chapter_number} /{" "}
                    {stages.length}
                  </span>
                </div>

                <TypingEngine
                  text={stages[currentStageIndex].content}
                  onComplete={handleStageComplete}
                  onProgress={handleProgress}
                />
              </motion.div>
            )}

            {gameState === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center border border-yellow-500/30">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                </div>
                <h2 className="text-4xl text-white font-black">
                  Hoàn Thành Tuyệt Vời!
                </h2>
                <div className="text-slate-400 text-lg">
                  Chờ những người chơi khác hoàn tất... hoặc quay lại sảnh.
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => router.push("/studies/games/typing")}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
                  >
                    <LayoutGrid className="w-5 h-5" /> Tìm phòng khác
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function MultiplayerGamePlay() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#020617] flex justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <GamePlayContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { Loader2, Trophy, RefreshCcw, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TypingEngine from "./TypingEngine";

interface TypingMap {
  id: number;
  name: string;
  thumbnail_url: string;
  total_chapters: number;
}

interface TypingStage {
  id: number;
  chapter_number: number;
  content: string;
  difficulty: string;
}

interface Props {
  map: TypingMap;
  onExit: () => void;
}

export default function TypingGamePlay({ map, onExit }: Props) {
  const [stages, setStages] = useState<TypingStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [gameState, setGameState] = useState<
    "countdown" | "playing" | "results"
  >("countdown");
  const [countdown, setCountdown] = useState(3);
  const [results, setResults] = useState<{ wpm: number; accuracy: number }[]>(
    [],
  );

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const res = await fetch(
          `${FeApiProxyUrl}/typing-game/maps/${map.id}/stages`,
        );
        const data = await res.json();
        if (data.code === 200) setStages(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStages();
  }, [map.id]);

  useEffect(() => {
    if (gameState === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState("playing");
      }
    }
  }, [gameState, countdown]);

  const handleStageComplete = (stats: { wpm: number; accuracy: number }) => {
    const newResults = [...results, stats];
    setResults(newResults);

    if (currentStageIndex < stages.length - 1) {
      setTimeout(() => {
        setCurrentStageIndex(currentStageIndex + 1);
        setGameState("countdown");
        setCountdown(3);
      }, 500);
    } else {
      setTimeout(() => {
        setGameState("results");
      }, 500);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-6">
        <Loader2 className="w-16 h-16 text-sky-500 animate-spin" />
        <div className="text-center">
          <h3 className="text-white font-black text-2xl uppercase tracking-widest mb-1">
            Cargando Mission...
          </h3>
          <p className="text-slate-500 font-medium italic">
            Đang tải kịch bản màn chơi từ vệ tinh CineFluent
          </p>
        </div>
      </div>
    );
  }

  if (gameState === "results") {
    const avgWpm = Math.round(
      results.reduce((acc, r) => acc + r.wpm, 0) / (results.length || 1),
    );
    const avgAccuracy = Math.round(
      results.reduce((acc, r) => acc + r.accuracy, 0) / (results.length || 1),
    );

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl mx-auto py-12 px-6"
      >
        <div className="bg-slate-900/60 backdrop-blur-3xl p-10 md:p-20 rounded-[80px] border-4 border-white/5 shadow-[0_64px_128px_rgba(0,0,0,0.4)] relative overflow-hidden text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-sky-500/10 blur-[140px] rounded-full -z-10" />

          <div className="relative z-10">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[40px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-yellow-500/20 rotate-12"
            >
              <Trophy className="w-16 h-16 text-black" />
            </motion.div>

            <h2 className="text-5xl md:text-7xl font-black text-white mb-4 uppercase tracking-tighter leading-none">
              Mission
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">
                Accomplished
              </span>
            </h2>
            <p className="text-slate-500 text-lg font-bold mb-16 uppercase tracking-widest">
              Map: {map.name} • All Chapters Cleared
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white/5 rounded-[48px] p-12 border border-white/5 backdrop-blur-md group hover:bg-white/10 transition-colors">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                  Final Average Speed
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-8xl font-black text-white font-mono tracking-tighter">
                    {avgWpm}
                  </span>
                  <span className="text-slate-500 font-black text-xs uppercase self-end mb-4">
                    Words/Min
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-[48px] p-12 border border-white/5 backdrop-blur-md group hover:bg-white/10 transition-colors">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-4">
                  Final Accuracy
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-8xl font-black text-emerald-400 font-mono tracking-tighter">
                    {avgAccuracy}
                  </span>
                  <span className="text-slate-500 font-black text-xs uppercase self-end mb-4">
                    % Percent
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-6">
              <button
                onClick={() => window.location.reload()}
                className="bg-white text-black px-12 py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:bg-sky-400 hover:text-white transition-all active:scale-95 shadow-2xl shadow-white/5"
              >
                <RefreshCcw className="w-6 h-6" /> CHƠI LẠI
              </button>
              <button
                onClick={onExit}
                className="bg-slate-800 text-white px-12 py-6 rounded-[32px] font-black text-xl flex items-center justify-center gap-3 hover:bg-slate-700 transition-all active:scale-95"
              >
                <LayoutGrid className="w-6 h-6" /> CHỌN MAP KHÁC
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col items-center justify-center">
      <AnimatePresence mode="wait">
        {gameState === "countdown" ? (
          <motion.div
            key="countdown"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="flex flex-col items-center gap-12"
          >
            <div className="text-center space-y-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block bg-sky-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em]"
              >
                Initializing Chapter {currentStageIndex + 1}
              </motion.div>
              <h2 className="text-6xl font-black text-white tracking-tighter uppercase">
                {map.name}
              </h2>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-sky-500 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative w-72 h-72 bg-slate-900 backdrop-blur-3xl rounded-[80px] border-4 border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
                <span className="text-[12rem] font-black text-white font-mono leading-none flex items-center justify-center">
                  {countdown}
                </span>
                <div className="absolute bottom-4 w-full text-center">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">
                    Starting in...
                  </p>
                </div>
              </div>
            </div>
            <p className="text-slate-500 font-black text-xl uppercase tracking-[1em] ml-4 animate-pulse">
              Stay Ready
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-4 px-4 w-full">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white font-black text-2xl border border-white/5">
                  {currentStageIndex + 1}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">
                    Chapter Clearance
                  </h2>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                    {map.name} • 5 Stages Total
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {stages.map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor:
                        i === currentStageIndex
                          ? "#38bdf8"
                          : i < currentStageIndex
                            ? "#10b981"
                            : "rgba(255,255,255,0.05)",
                      width: i === currentStageIndex ? 60 : 30,
                    }}
                    className="h-2 rounded-full relative overflow-hidden bg-white/5"
                  >
                    <motion.div
                      className="absolute inset-0"
                      animate={{
                        backgroundColor:
                          i === currentStageIndex
                            ? "#38bdf8"
                            : i < currentStageIndex
                              ? "#10b981"
                              : "rgba(255,255,255,0.05)",
                      }}
                    />
                    {i === currentStageIndex && (
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {stages[currentStageIndex] && (
              <TypingEngine
                text={stages[currentStageIndex].content}
                onComplete={handleStageComplete}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

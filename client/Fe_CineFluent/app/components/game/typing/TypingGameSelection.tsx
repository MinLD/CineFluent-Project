"use client";

import { useEffect, useState } from "react";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { Loader2, Play, Shuffle } from "lucide-react";
import { motion } from "framer-motion";

interface TypingMap {
  id: number;
  name: string;
  thumbnail_url: string;
  description: string;
  total_chapters: number;
}

interface Props {
  onSelectMap: (map: TypingMap) => void;
}

export default function TypingGameSelection({ onSelectMap }: Props) {
  const [maps, setMaps] = useState<TypingMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchMaps = async () => {
      try {
        const res = await fetch(`${FeApiProxyUrl}/typing-game/maps`);
        const data = await res.json();
        if (data.code === 200) setMaps(data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMaps();
  }, []);

  const handleRandomSpin = () => {
    if (maps.length === 0) return;
    setSpinning(true);
    let count = 0;
    const maxCount = 20;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * maps.length);
      setSelectedIndex(randomIndex);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        setSpinning(false);
        // Show selected map for a bit then auto-select
        setTimeout(() => {
          onSelectMap(maps[randomIndex]);
        }, 800);
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        <div className="flex flex-col items-center gap-1">
          <p className="text-white font-bold text-xl uppercase tracking-widest">
            CineFluent Games
          </p>
          <p className="text-slate-500 text-sm">Đang tải kho bản đồ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 animate-in fade-in duration-700">
      <div className="text-center mb-16 space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block bg-sky-500/10 text-sky-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.3em] mb-2"
        >
          Solo Core Mode
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase leading-none">
          Typing
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
            Mastery
          </span>
        </h1>
        <p className="text-slate-500 text-xl max-w-2xl mx-auto font-medium">
          Chinh phục 5 chương truyện bằng tốc độ gõ phím của chính bạn.
        </p>
      </div>

      <div className="flex justify-center mb-20">
        <button
          onClick={handleRandomSpin}
          disabled={spinning || maps.length === 0}
          className="group relative bg-white text-black px-12 py-6 rounded-[32px] font-black text-xl flex items-center gap-4 shadow-2xl shadow-white/10 hover:bg-sky-400 hover:text-white transition-all active:scale-95 disabled:opacity-50 overflow-hidden"
        >
          <Shuffle
            className={`w-8 h-8 ${spinning ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
          />
          CHỌN MAP NGẪU NHIÊN
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {maps.map((map, index) => (
          <motion.div
            key={map.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: selectedIndex === index ? 1.05 : 1,
            }}
            transition={{ delay: index * 0.1 }}
            onClick={() => !spinning && onSelectMap(map)}
            className={`group bg-slate-900/40 backdrop-blur-xl border-2 rounded-[48px] overflow-hidden cursor-pointer hover:bg-slate-800/60 transition-all duration-500 ${
              selectedIndex === index
                ? "border-sky-400 shadow-[0_0_50px_rgba(56,189,248,0.3)]"
                : "border-white/5 shadow-sm"
            }`}
          >
            <div className="aspect-[16/11] relative overflow-hidden">
              <img
                src={
                  map.thumbnail_url ||
                  "https://images.unsplash.com/photo-1550745165-9bc0b252726f"
                }
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                  <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest whitespace-nowrap">
                    Chapter Journey
                  </span>
                </div>
                <h3 className="text-3xl font-black text-white leading-tight">
                  {map.name}
                </h3>
              </div>
            </div>
            <div className="p-8">
              <p className="text-slate-400 font-medium line-clamp-2 h-12 mb-8 text-sm leading-relaxed">
                {map.description ||
                  "Hành trình gõ chữ đầy cảm hứng đang chờ đợi bạn khám phá qua từng chương truyện."}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-white font-black text-lg group-hover:bg-sky-500 transition-colors">
                    {map.total_chapters}
                  </div>
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    Tổng Số
                    <br />
                    Chương
                  </div>
                </div>
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                    selectedIndex === index
                      ? "bg-white text-sky-500 scale-110"
                      : "bg-slate-800 text-slate-500 group-hover:bg-white group-hover:text-black"
                  }`}
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

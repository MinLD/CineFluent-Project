"use client";

import { useState } from "react";
import { User, Users, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function TypingModeSelection() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      toast.error("Vui lòng nhập mã phòng!");
      return;
    }
    // TODO: Verify room exists via React Query / Server Action here
    router.push(`/studies/games/typing/multiplayer?room=${roomCode.trim()}`);
  };

  const handleCreateRoom = () => {
    // Navigate to multiplayer page with create flag
    router.push("/studies/games/typing/multiplayer?action=create");
  };

  return (
    <div className="min-h-screen bg-[#020617] pt-24 px-4 sm:px-6 lg:px-8 pb-12 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Typing Game Modes
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Chọn chế độ chơi để bắt đầu luyện gõ. Chơi một mình để cải thiện kỹ
            năng, hoặc thể hiện tốc độ với bạn bè!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Card: Chơi Đơn */}
          <Link href="/studies/games/typing/solo" className="block group">
            <div className="relative h-full bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden hover:border-blue-500/50 transition-all duration-300">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <User className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Chơi Đơn (Solo)
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Tự do lựa chọn chủ đề, vượt qua các thử thách và tự phá kỷ lục
                của chính mình.
              </p>

              <div className="mt-auto inline-flex items-center text-sm font-semibold text-blue-400 group-hover:text-blue-300">
                Chơi ngay{" "}
                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Card: Tạo Phòng */}
          <div
            onClick={handleCreateRoom}
            className="block group cursor-pointer"
          >
            <div className="relative h-full bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden hover:border-purple-500/50 transition-all duration-300">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Tạo Phòng (Host)
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Tạo một phòng chơi riêng tư, chọn bộ từ vựng và gửi mã mời cho
                bạn bè cùng đua.
              </p>

              <div className="mt-auto inline-flex items-center text-sm font-semibold text-purple-400 group-hover:text-purple-300">
                Tạo phòng mới{" "}
                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Card: Tham Gia Phòng */}
          <div className="relative h-full bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden flex flex-col hover:border-emerald-500/50 transition-colors duration-300 group">
            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
              <KeyRound className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Nhập Mã Phòng</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Bạn bè đã tạo phòng? Nhập mã gồm 6 chữ số vào đây để tham gia
              ngay.
            </p>

            <div className="mt-auto relative h-10 overflow-visible">
              {/* Default text visible before hover */}
              <div className="absolute inset-0 flex items-center text-sm font-semibold text-emerald-400 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
                Tham gia phòng <ArrowRight className="ml-1 w-4 h-4" />
              </div>

              {/* Form reveals on hover */}
              <form
                onSubmit={handleJoinRoom}
                className="absolute inset-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0"
              >
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="VD: ABCD12"
                  maxLength={6}
                  className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-center font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white p-2 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Gamepad2, Video } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Games Hub | CineFluent",
  description: "Trung tâm trò chơi và luyện tập tương tác CineFluent.",
};

export default function GamesHubPage() {
  return (
    <div className="min-h-screen bg-[#020617] pt-20 px-4 sm:px-6 lg:px-8 pb-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            Game & Luyện Tập
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Giao lưu, thi đấu và rèn luyện phản xạ tiếng Anh cùng AI hoặc những
            người chơi khác.
          </p>
        </div>

        {/* Cần SSR đục lỗ hiện CSR thì chia component, ở đây tạm thời tĩnh, mốt gọi lịch sử user vào Suspense */}
        <Suspense
          fallback={
            <div className="animate-pulse bg-slate-800 h-64 rounded-3xl"></div>
          }
        >
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card Typing Game */}
            <Link href="/studies/games/typing" className="block group">
              <div className="relative h-full bg-slate-900 border border-slate-800 rounded-[2rem] p-8 overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-all">
                    <Gamepad2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Typing Game
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                    Luyện gõ tiếng Anh siêu tốc băng qua các chướng ngại vật tử
                    thần. Chơi đơn hoặc đua xếp hạng với bạn bè.
                  </p>

                  <div className="inline-flex items-center text-sm font-semibold text-indigo-400 group-hover:text-indigo-300">
                    Sẵn sàng chơi{" "}
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card Video Call */}
            <Link href="/studies/games/call" className="block group">
              <div className="relative h-full bg-slate-900 border border-slate-800 rounded-[2rem] p-8 overflow-hidden hover:border-emerald-500/50 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:text-emerald-300 group-hover:scale-110 transition-all">
                    <Video className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Real-time Video Call
                  </h3>
                  <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                    Dấn thân vào cuộc hội thoại 1:1 thực tế. AI Gemini sẽ làm
                    trợ lí ảo trực tiếp gợi ý chủ đề và từ vựng cho bạn.
                  </p>

                  <div className="inline-flex items-center text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
                    Bắt đầu hội thoại{" "}
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </Suspense>
      </div>
    </div>
  );
}

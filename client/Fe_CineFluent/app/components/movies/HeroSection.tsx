"use client";

import { ExploreButton } from "@/app/components/movies/ExploreButton";
import { Video, Loader2 } from "lucide-react";
import banner from "../../../public/img/bannerMovie.jpg";
import { useState } from "react";
import { importYouTubeVideoAction } from "@/app/lib/actions/videos";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/lib/hooks/useAuth";

export function HeroSection() {
  const { token } = useAuth();
  const [videoLink, setVideoLink] = useState("");
  const router = useRouter();
  const queryClient = useQueryClient();

  // TanStack Query mutation for importing video
  const importMutation = useMutation({
    mutationFn: (url: string) => importYouTubeVideoAction(url, token || ""),
    onSuccess: (data) => {
      console.log(data);
      if (data.success) {
        toast.success("Import video thành công!");
        setVideoLink(""); // Clear input

        // Invalidate videos query to refetch the list
        queryClient.invalidateQueries({ queryKey: ["videos"] });

        // Optional: Navigate to the new video
        // router.push(`/studies/movies/${data.data.id}`);
      } else {
        toast.error(data.error || "Import video thất bại");
      }
    },
    onError: (error: any) => {
      console.log("Import error:", error);
      toast.error("Có lỗi xảy ra khi import video");
    },
  });

  const handleImport = () => {
    if (!videoLink.trim()) {
      toast.error("Vui lòng nhập link YouTube");
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoLink)) {
      toast.error("Link YouTube không hợp lệ");
      return;
    }

    importMutation.mutate(videoLink);
  };

  return (
    <>
      <div className="relative py-30">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${banner.src})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Title */}
          <h1 className="text-5xl font-bold text-white mb-4">Thư Viện Video</h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Khám phá hàng ngàn video được phân tích bởi AI, sẵn sàng cho hành
            trình học tiếng Anh của bạn
          </p>

          {/* Import Section */}
          <div className="max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <Video className="w-5 h-5 text-blue-400" />
              <span className="text-slate-300 font-medium">
                Dán link YouTube để import video mới:
              </span>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !importMutation.isPending) {
                    handleImport();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={importMutation.isPending}
              />
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="px-6 py-3 text-white bg-blue-500 font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 flex items-center gap-2 min-w-[140px] justify-center"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  "Nhập video"
                )}
              </button>
            </div>

            <p className="text-sm text-slate-400 mt-3">
              Hỗ trợ YouTube và các nền tảng video phổ biến khác.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 flex items-center justify-center w-full">
          <ExploreButton />
        </div>
      </div>

      {/* Loading Overlay - Shows during import */}
      {importMutation.isPending && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 shadow-2xl max-w-sm mx-4">
            <div className="flex flex-col items-center gap-6">
              {/* Animated Spinner */}
              <div className="relative">
                <div className="w-20 h-20 border-4 border-slate-700 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-blue-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
              </div>

              {/* Progress Text */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-white">
                  Đang nhập video...
                </h3>
                <p className="text-sm text-slate-400">
                  Đang tải subtitle và dịch sang tiếng Việt
                </p>
                <p className="text-xs text-slate-500 mt-4">
                  Quá trình này có thể mất 30-60 giây
                </p>
              </div>

              {/* Animated Dots */}
              <div className="flex gap-2">
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

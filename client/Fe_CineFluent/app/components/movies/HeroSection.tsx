"use client";

import { Video, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { importYouTubeVideoAction } from "@/app/lib/actions/videos";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/lib/hooks/useAuth";
import Modal_Show from "@/app/components/modal_show";

export function HeroSection() {
  const { token } = useAuth();
  const [videoLink, setVideoLink] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // TanStack Query mutation for importing video
  const importMutation = useMutation({
    mutationFn: (url: string) => importYouTubeVideoAction(url, token || ""),
    onSuccess: (data) => {
      console.log(data);
      if (data.success) {
        toast.success(data.message);
        setVideoLink(""); // Clear input
        setIsOpen(false); // Close modal

        // Invalidate videos query to refetch the list
        queryClient.invalidateQueries({ queryKey: ["videos"] });
      } else {
        toast.error(data.message || "Import video thất bại");
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

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(videoLink)) {
      toast.error("Link YouTube không hợp lệ");
      return;
    }

    importMutation.mutate(videoLink);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full md:w-auto justify-center items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-full transition-colors border border-slate-700"
      >
        <Plus size={18} />
        <span>Import Video</span>
      </button>

      {/* Import Modal */}
      {isOpen && (
        <Modal_Show setClose={() => setIsOpen(false)}>
          <div className="p-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="w-6 h-6 text-blue-600" />
              Import Video từ YouTube
            </h2>

            <p className="text-gray-600 mb-4 text-sm">
              Dán đường dẫn video YouTube vào bên dưới. Hệ thống sẽ tự động tải
              subtitle và phân tích video.
            </p>

            <div className="flex gap-2">
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
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={importMutation.isPending}
                autoFocus
              />
              <button
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="px-6 py-3 text-white bg-blue-600 font-semibold rounded-lg transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px] justify-center"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Xử lý...</span>
                  </>
                ) : (
                  "Import"
                )}
              </button>
            </div>

            {/* Loading Status used to be an overlay, now inline/toast is better, but keeping overlay if user prefers strict waiting */}
            {importMutation.isPending && (
              <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-3 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <div>
                  <p className="font-semibold">Đang xử lý video...</p>
                  <p className="text-xs opacity-80">
                    Vui lòng không đóng cửa sổ này.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Modal_Show>
      )}
    </>
  );
}

"use client";

import { X, Check, Languages, Plus, Trash2, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Spanning from "@/app/components/spanning";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { I_Video } from "@/app/lib/types/video";
import {
  uploadSubtitlesAction,
  deleteSubtitlesAction,
  updateVideoAction,
} from "@/app/lib/actions/videos";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";

type Props = {
  setClose: () => void;
  token: string;
  video: I_Video;
};

export default function AdminSubtitlesModal({ setClose, token, video }: Props) {
  const router = useRouter();
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  // States for Subtitle Uploads
  const [enSubtitleFile, setEnSubtitleFile] = useState<File | null>(null);
  const [viSubtitleFile, setViSubtitleFile] = useState<File | null>(null);

  const fetchSubtitles = async () => {
    if (!video.subtitle_vtt_url) {
      setIsLoading(false);
      setSubtitles([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${FeApiProxyUrl}${video.subtitle_vtt_url}`);
      const vttText = await response.text();

      // Khởi tạo Web Worker
      const worker = new Worker(
        new URL("@/app/utils/vtt.worker.ts", import.meta.url),
      );

      worker.onmessage = (e) => {
        if (e.data.success) {
          setSubtitles(e.data.subtitles);
        } else {
          toast.error("Lỗi khi bóc tách phụ đề VTT: " + e.data.error);
        }
        worker.terminate();
        setIsLoading(false);
      };

      worker.postMessage({ vttText });
    } catch (error) {
      toast.error("Lỗi khi kết nối để tải file VTT");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtitles();
  }, [video.id, token]);

  const handleUploadSubtitlesSubmit = async () => {
    if (!enSubtitleFile && !viSubtitleFile) {
      toast.warning("Vui lòng chọn ít nhất 1 file phụ đề (EN hoặc VI)");
      return;
    }

    setIsSubmittingSub(true);
    const toastId = toast.loading("Đang xử lý và đồng bộ phụ đề...");

    const subForm = new FormData();
    if (enSubtitleFile) subForm.append("en_file", enSubtitleFile);
    if (viSubtitleFile) subForm.append("vi_file", viSubtitleFile);

    try {
      const res = await uploadSubtitlesAction(Number(video.id), subForm, token);
      if (res.success) {
        toast.success(res.message || "Đã tải phụ đề lên thành công!", {
          id: toastId,
        });
        setEnSubtitleFile(null);
        setViSubtitleFile(null);
        fetchSubtitles(); // Reload subtitles
        router.refresh();
      } else {
        toast.error(res.error || "Lỗi upload phụ đề", { id: toastId });
      }
    } catch (err) {
      toast.error("Đã có lỗi xảy ra", { id: toastId });
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleDeleteAllSubtitles = async () => {
    if (
      !confirm("Bạn có chắc chắn muốn xóa TOÀN BỘ phụ đề của phim này không?")
    )
      return;

    setIsSubmittingSub(true);
    try {
      const res = await deleteSubtitlesAction(Number(video.id), token);
      if (res.success) {
        toast.success("Đã xóa sạch phụ đề!");
        setSubtitles([]);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Lỗi khi xóa phụ đề");
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleResyncAllSubtitles = async () => {
    setIsSubmittingSub(true);
    const toastId = toast.loading("Đang đồng bộ hóa file VTT vật lý...");
    try {
      const res = await updateVideoAction(Number(video.id), {}, token);
      if (res.success) {
        toast.success("Đồng bộ hóa thành công!", { id: toastId });
        router.refresh();
      } else {
        toast.error(res.error, { id: toastId });
      }
    } catch (err) {
      toast.error("Lỗi đồng bộ", { id: toastId });
    } finally {
      setIsSubmittingSub(false);
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Languages className="text-indigo-600" /> Quản lý phụ đề:{" "}
          <span className="text-indigo-600 truncate max-w-[400px]">
            {video.title}
          </span>
        </h2>
        <button
          onClick={setClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
        >
          <X size={28} />
        </button>
      </div>

      <div className="max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex flex-col space-y-6 pb-6 min-h-[500px]">
          {/* Upload Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl hidden sm:block">
                <Globe size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Quản lý Phụ đề Đa ngữ</h3>
                <p className="text-indigo-100 text-sm mt-1">
                  Chọn 2 file .srt riêng biệt để đồng bộ với nhau.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {/* Tiếng Anh file input */}
                <label
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all flex flex-col items-center justify-center min-w-[140px] border-2 ${
                    enSubtitleFile
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} /> <span>Tải EN (.srt)</span>
                  </div>
                  {enSubtitleFile && (
                    <span className="text-[10px] font-normal mt-1 opacity-80 truncate w-[120px] text-center">
                      {enSubtitleFile.name}
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".srt,.vtt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setEnSubtitleFile(file);
                    }}
                  />
                </label>

                {/* Tiếng Việt file input */}
                <label
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold shadow-md cursor-pointer transition-all flex flex-col items-center justify-center min-w-[140px] border-2 ${
                    viSubtitleFile
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                      : "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} /> <span>Tải VI (.srt)</span>
                  </div>
                  {viSubtitleFile && (
                    <span className="text-[10px] font-normal mt-1 opacity-80 truncate w-[120px] text-center">
                      {viSubtitleFile.name}
                    </span>
                  )}
                  <input
                    type="file"
                    accept=".srt,.vtt"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setViSubtitleFile(file);
                    }}
                  />
                </label>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleUploadSubtitlesSubmit}
                disabled={
                  isSubmittingSub || (!enSubtitleFile && !viSubtitleFile)
                }
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full"
              >
                {isSubmittingSub ? (
                  <Spanning />
                ) : (
                  <>
                    <Check size={18} /> Lưu / Thêm Phụ Đề
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 border border-gray-100 rounded-3xl bg-white shadow-sm flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Preview Danh sách ({subtitles.length} dòng)
              </span>
              <div className="flex items-center gap-6">
                <button
                  onClick={handleDeleteAllSubtitles}
                  disabled={isSubmittingSub || subtitles.length === 0}
                  className="text-xs text-rose-500 font-bold hover:underline disabled:text-gray-300"
                >
                  Xóa sạch phụ đề
                </button>
                <button
                  onClick={handleResyncAllSubtitles}
                  disabled={isSubmittingSub || subtitles.length === 0}
                  className="text-xs text-indigo-600 font-bold hover:underline disabled:text-gray-300"
                >
                  Đồng bộ (Re-sync)
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {isLoading ? (
                // Skeleton Loader
                Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="p-5 border border-gray-100 rounded-2xl flex items-start gap-5"
                  >
                    <Skeleton width={80} height={24} borderRadius={8} />
                    <div className="flex-1 grid grid-cols-2 gap-6">
                      <Skeleton count={2} height={20} />
                      <Skeleton count={2} height={20} />
                    </div>
                  </div>
                ))
              ) : subtitles.length > 0 ? (
                // Subtitles List
                subtitles.map((sub, idx) => (
                  <div
                    key={idx}
                    className="group p-5 border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 rounded-2xl transition-all flex items-start gap-5"
                  >
                    <div className="bg-gray-100 text-gray-500 text-[10px] py-1.5 px-2 rounded-lg font-mono w-24 flex-shrink-0 text-center shadow-sm">
                      {Number(sub.start_time).toFixed(2)}s
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-6">
                      <div className="text-sm text-gray-600 leading-relaxed font-medium">
                        {sub.content_en}
                      </div>
                      <div className="text-sm text-indigo-900 font-bold leading-relaxed border-l-2 border-indigo-100 pl-4">
                        {sub.content_vi || "Chưa có bản dịch..."}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Empty State
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Languages size={64} strokeWidth={1} />
                  <p className="mt-4 font-bold text-gray-400">
                    Chưa có dữ liệu phụ đề
                  </p>
                  <p className="text-xs mt-1">
                    Hãy bắt đầu bằng cách tải lên file .srt của bạn
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Check, Globe, Languages, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { toast } from "sonner";

import Spanning from "@/app/components/spanning";
import { MovieDifficultyBadge } from "@/app/components/movies/MovieDifficultyBadge";
import {
  analyzeVideoDifficultyAction,
  deleteSubtitlesAction,
  updateVideoAction,
  uploadSubtitlesAction,
} from "@/app/lib/actions/videos";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { I_Video } from "@/app/lib/types/video";

import "react-loading-skeleton/dist/skeleton.css";

type Props = {
  setClose: () => void;
  token: string;
  video: I_Video;
};

export default function AdminSubtitlesModal({ setClose, token, video }: Props) {
  const router = useRouter();
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [subtitleVttUrl, setSubtitleVttUrl] = useState<string | null>(
    video.subtitle_vtt_url || null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [enSubtitleFile, setEnSubtitleFile] = useState<File | null>(null);
  const [viSubtitleFile, setViSubtitleFile] = useState<File | null>(null);

  const fetchSubtitlesFromDb = async () => {
    const response = await fetch(`${FeApiProxyUrl}/videos/${video.id}/subtitles`);
    if (!response.ok) {
      throw new Error("Khong the tai subtitle tu database");
    }

    const payload = await response.json();
    setSubtitles(payload?.data || []);
  };

  const fetchSubtitles = async (nextVttUrl?: string | null) => {
    const vttUrl = nextVttUrl ?? subtitleVttUrl;
    setIsLoading(true);
    try {
      if (!vttUrl) {
        await fetchSubtitlesFromDb();
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${FeApiProxyUrl}${vttUrl}`);
      if (!response.ok) {
        throw new Error("Khong the tai file VTT");
      }
      const vttText = await response.text();

      if (!vttText.trim()) {
        throw new Error("File VTT rong");
      }

      const worker = new Worker(
        new URL("@/app/utils/vtt.worker.ts", import.meta.url),
      );

      worker.onmessage = (e) => {
        if (e.data.success) {
          setSubtitles(e.data.subtitles);
        } else {
          toast.error(`Loi khi boc tach phu de VTT: ${e.data.error}`);
        }
        worker.terminate();
        setIsLoading(false);
      };

      worker.postMessage({ vttText });
    } catch {
      try {
        await fetchSubtitlesFromDb();
      } catch {
        toast.error("Loi khi tai subtitle tu VTT va database");
        setSubtitles([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    setSubtitleVttUrl(video.subtitle_vtt_url || null);
  }, [video.id, video.subtitle_vtt_url]);

  useEffect(() => {
    fetchSubtitles(subtitleVttUrl);
  }, [video.id, subtitleVttUrl, token]);

  const handleUploadSubtitlesSubmit = async () => {
    if (!enSubtitleFile && !viSubtitleFile) {
      toast.warning("Vui long chon it nhat 1 file phu de (EN hoac VI)");
      return;
    }

    setIsSubmittingSub(true);
    const toastId = toast.loading("Dang xu ly va dong bo phu de...");

    const subForm = new FormData();
    if (enSubtitleFile) subForm.append("en_file", enSubtitleFile);
    if (viSubtitleFile) subForm.append("vi_file", viSubtitleFile);

    try {
      const res = await uploadSubtitlesAction(Number(video.id), subForm);
      if (res.success) {
        toast.success(res.message || "Da tai phu de len thanh cong!", {
          id: toastId,
        });

        const nextVttUrl = res.data?.subtitle_vtt_url || null;
        setSubtitleVttUrl(nextVttUrl);
        setEnSubtitleFile(null);
        setViSubtitleFile(null);
        await fetchSubtitles(nextVttUrl);
        router.refresh();
      } else {
        toast.error(res.error || "Loi upload phu de", { id: toastId });
      }
    } catch {
      toast.error("Da co loi xay ra", { id: toastId });
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleAnalyzeDifficulty = async () => {
    setIsAnalyzingAi(true);
    const toastId = toast.loading("Dang phan tich do kho phim...");

    try {
      const res = await analyzeVideoDifficultyAction(Number(video.id));
      if (res.success) {
        toast.success(
          res.message ||
            "Da bat dau phan tich do kho phim. Vui long doi trong giay lat va refresh lai.",
          {
            id: toastId,
          },
        );
        window.setTimeout(() => {
          router.refresh();
        }, 1200);
        window.setTimeout(() => {
          router.refresh();
        }, 5000);
      } else {
        toast.error(res.error || "Khong the phan tich do kho phim.", {
          id: toastId,
        });
      }
    } catch {
      toast.error("Co loi xay ra khi phan tich do kho phim.", { id: toastId });
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleDeleteAllSubtitles = async () => {
    if (!confirm("Ban co chac chan muon xoa TOAN BO phu de cua phim nay khong?")) {
      return;
    }

    setIsSubmittingSub(true);
    try {
      const res = await deleteSubtitlesAction(Number(video.id));
      if (res.success) {
        toast.success("Da xoa sach phu de!");
        setSubtitles([]);
        setSubtitleVttUrl(null);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Loi khi xoa phu de");
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleResyncAllSubtitles = async () => {
    setIsSubmittingSub(true);
    const toastId = toast.loading("Dang dong bo hoa file VTT vat ly...");

    try {
      const res = await updateVideoAction(Number(video.id), {});
      if (res.success) {
        const nextVttUrl = res.data?.data?.subtitle_vtt_url || null;
        setSubtitleVttUrl(nextVttUrl);
        toast.success("Dong bo hoa thanh cong!", { id: toastId });
        await fetchSubtitles(nextVttUrl);
        router.refresh();
      } else {
        toast.error(res.error, { id: toastId });
      }
    } catch {
      toast.error("Loi dong bo", { id: toastId });
    } finally {
      setIsSubmittingSub(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center justify-between px-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
          <Languages className="text-indigo-600" />
          Quan ly phu de:
          <span className="max-w-[400px] truncate text-indigo-600">
            {video.title}
          </span>
        </h2>
        <button
          onClick={setClose}
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={28} />
        </button>
      </div>

      <div className="custom-scrollbar max-h-[75vh] overflow-y-auto pr-2">
        <div className="flex min-h-[500px] flex-col space-y-6 pb-6">
          <div className="flex flex-col gap-6 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-700 p-8 text-white shadow-xl md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="hidden rounded-2xl bg-white/20 p-4 backdrop-blur-md sm:block">
                <Globe size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Quan ly phu de da ngu</h3>
                <p className="mt-1 text-sm text-indigo-100">
                  Chon 2 file .srt rieng biet de dong bo voi nhau.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <label
                  className={`flex min-w-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-4 py-2.5 text-sm font-bold shadow-md transition-all ${
                    enSubtitleFile
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} />
                    <span>Tai EN (.srt)</span>
                  </div>
                  {enSubtitleFile && (
                    <span className="mt-1 w-[120px] truncate text-center text-[10px] font-normal opacity-80">
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

                <label
                  className={`flex min-w-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 px-4 py-2.5 text-sm font-bold shadow-md transition-all ${
                    viSubtitleFile
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} />
                    <span>Tai VI (.srt)</span>
                  </div>
                  {viSubtitleFile && (
                    <span className="mt-1 w-[120px] truncate text-center text-[10px] font-normal opacity-80">
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

              <button
                type="button"
                onClick={handleUploadSubtitlesSubmit}
                disabled={isSubmittingSub || (!enSubtitleFile && !viSubtitleFile)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmittingSub ? (
                  <Spanning />
                ) : (
                  <>
                    <Check size={18} />
                    Luu / Them Phu De
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleAnalyzeDifficulty}
                disabled={isSubmittingSub || isAnalyzingAi || subtitles.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAnalyzingAi ? (
                  <Spanning />
                ) : (
                  <>
                    <Sparkles size={18} />
                    Phan tich do kho phim
                  </>
                )}
              </button>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm shadow-lg backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-100/90">
                  AI Movie Analysis
                </p>

                {video.ai_analysis ? (
                  video.ai_analysis.status === "FAILED" ? (
                    <div className="mt-2 space-y-2">
                      <span className="inline-flex items-center rounded-full border border-rose-200/40 bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-50">
                        AI that bai
                      </span>
                      {video.ai_analysis.error_message && (
                        <p
                          className="text-xs leading-5 text-rose-100/90"
                          title={video.ai_analysis.error_message}
                        >
                          {video.ai_analysis.error_message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <MovieDifficultyBadge analysis={video.ai_analysis} />
                      <p className="text-xs leading-5 text-indigo-100">
                        {video.ai_analysis.segment_count} subtitle da duoc phan tich.
                      </p>
                    </div>
                  )
                ) : (
                  <p className="mt-2 text-xs leading-5 text-indigo-100">
                    Chua co ket qua AI. Bam nut phan tich de luu do kho phim vao he thong.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between rounded-t-3xl border-b border-gray-100 bg-gray-50/50 p-5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                Preview danh sach ({subtitles.length} dong)
              </span>
              <div className="flex items-center gap-6">
                <button
                  onClick={handleDeleteAllSubtitles}
                  disabled={isSubmittingSub || subtitles.length === 0}
                  className="text-xs font-bold text-rose-500 hover:underline disabled:text-gray-300"
                >
                  Xoa sach phu de
                </button>
                <button
                  onClick={handleResyncAllSubtitles}
                  disabled={isSubmittingSub || subtitles.length === 0}
                  className="text-xs font-bold text-indigo-600 hover:underline disabled:text-gray-300"
                >
                  Dong bo (Re-sync)
                </button>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-5 rounded-2xl border border-gray-100 p-5"
                  >
                    <Skeleton width={80} height={24} borderRadius={8} />
                    <div className="grid flex-1 grid-cols-2 gap-6">
                      <Skeleton count={2} height={20} />
                      <Skeleton count={2} height={20} />
                    </div>
                  </div>
                ))
              ) : subtitles.length > 0 ? (
                subtitles.map((sub, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-5 rounded-2xl border border-transparent p-5 transition-all hover:border-indigo-100 hover:bg-indigo-50/30"
                  >
                    <div className="w-24 flex-shrink-0 rounded-lg bg-gray-100 px-2 py-1.5 text-center font-mono text-[10px] text-gray-500 shadow-sm">
                      {Number(sub.start_time).toFixed(2)}s
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-6">
                      <div className="text-sm font-medium leading-relaxed text-gray-600">
                        {sub.content_en}
                      </div>
                      <div className="border-l-2 border-indigo-100 pl-4 text-sm font-bold leading-relaxed text-indigo-900">
                        {sub.content_vi || "Chua co ban dich..."}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <Languages size={64} strokeWidth={1} />
                  <p className="mt-4 font-bold text-gray-400">
                    Chua co du lieu phu de
                  </p>
                  <p className="mt-1 text-xs">
                    Hay bat dau bang cach tai len file .srt cua ban
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

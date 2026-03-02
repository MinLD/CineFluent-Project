"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Flag, X, Send, AlertCircle } from "lucide-react";
import { axiosClient, BeUrl } from "@/app/lib/services/api_client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { toast } from "sonner";
import { createVideoReportAction } from "@/app/lib/actions/videos";

interface ReportFormInputs {
  issue_type: string;
  description: string;
}

const ISSUE_OPTIONS = [
  { value: "not_playing", label: "Phim không phát được / Bị lỗi mờ" },
  { value: "wrong_subtitle", label: "Sai phụ đề / Lệch Vietsub" },
  { value: "audio_sync_issue", label: "Lỗi âm thanh / Mất tiếng" },
  { value: "other", label: "Lỗi khác..." },
];

export function ReportVideoBtn({ videoId }: { videoId: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { userId } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ReportFormInputs>({
    mode: "onChange",
  });

  const reportMutation = useMutation({
    mutationFn: async (data: ReportFormInputs) => {
      const token =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("access_token="))
          ?.split("=")[1] || "";

      const response = await createVideoReportAction(
        {
          ...data,
          video_id: videoId,
        },
        token,
      );

      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Cảm ơn bạn! Báo cáo lỗi đã được gửi cho Admin.");
      reset();
      setIsOpen(false);
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Lỗi khi gửi báo cáo video.";
      toast.error(msg);
    },
  });

  const onSubmit = (data: ReportFormInputs) => {
    reportMutation.mutate(data);
  };

  const handleOpenClick = () => {
    if (!userId) {
      toast.warning("Bạn cần đăng nhập để báo cáo lỗi phim.");
      router.push("/login");
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Nút ngoài Video Player */}
      <button
        onClick={handleOpenClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg   text-red-500 hover:text-red-400 transition-colors text-sm font-medium z-50 mr-4"
        title="Báo lỗi video này"
      >
        <Flag className="w-4 h-4" />
      </button>

      {/* Modal Popup overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[999999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#1a1c23] border border-gray-800 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            {/* Nút Tắt */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6 mt-2">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">
                Báo Cáo Sự Cố
              </h2>
              <p className="text-slate-400 text-sm">
                Chúng tôi rất tiếc vì trải nghiệm xem phim của bạn bị gián đoạn.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Select Loại Lỗi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Lý Do (Bắt buộc) <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("issue_type", {
                    required: "Vui lòng chọn loại lỗi.",
                  })}
                  className="w-full bg-[#0f1115] border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all appearance-none"
                >
                  <option value="">-- Chọn vấn đề bạn gặp phải --</option>
                  {ISSUE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.issue_type && (
                  <p className="text-red-500 text-xs mt-1 px-1">
                    ★ {errors.issue_type.message}
                  </p>
                )}
              </div>

              {/* Chi tiết thêm */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Mô tả chi tiết (Tùy chọn)
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Điền thêm chi tiết (Ví dụ: Bị lỗi ở phút 15:20...)"
                  className="w-full bg-[#0f1115] border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all resize-none text-sm"
                />
              </div>

              {/* Nút Submit */}
              <button
                type="submit"
                disabled={reportMutation.isPending || !isValid}
                className="w-full mt-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {reportMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang gửi...
                  </span>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Gửi Báo Cáo
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

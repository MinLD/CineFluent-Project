"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Film, Send, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { toast } from "sonner";
import { createMovieRequestAction } from "@/app/lib/actions/videos";
import MyLayout from "@/app/layout/index";

interface RequestFormInputs {
  title: string;
  note: string;
}

export default function RequestMoviePage() {
  const router = useRouter();
  const { userId } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormInputs>();

  const requestMutation = useMutation({
    mutationFn: async (data: RequestFormInputs) => {
      const token =
        document.cookie
          .split("; ")
          .find((row) => row.startsWith("access_token="))
          ?.split("=")[1] || "";

      const response = await createMovieRequestAction(data, token);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Đã gửi yêu cầu phim thành công! Admin sẽ xem xét sớm.");
      reset();
      router.push("/studies/movies");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Có lỗi xảy ra khi gửi yêu cầu.";
      toast.error(msg);
    },
  });

  const onSubmit = (data: RequestFormInputs) => {
    if (!userId) {
      toast.warning("Vui lòng đăng nhập để gửi yêu cầu phim.");
      router.push(`/login`);
      return;
    }
    requestMutation.mutate(data);
  };

  return (
    <MyLayout>
      <div className="flex flex-col items-center justify-center my-12 px-4 max-w-4xl mx-auto">
        <div className="w-full bg-white border border-gray-100 rounded-3xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-100 shadow-sm">
              <Film className="w-10 h-10 text-blue-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Yêu Cầu Phim Mới
            </h1>
            <p className="text-gray-500 max-w-lg mx-auto md:text-lg">
              Hãy cho chúng tôi biết bộ phim bạn muốn học tiếng Anh, chúng tôi
              sẽ ưu tiên cập nhật sớm nhất có thể!
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6 max-w-2xl mx-auto"
          >
            {/* Tên Phim */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Tên Phim <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Film className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register("title", {
                    required: "Vui lòng nhập tên phim.",
                    minLength: { value: 2, message: "Tên phim quá ngắn." },
                  })}
                  type="text"
                  placeholder="Ví dụ: Friends, Harry Potter..."
                  className={`w-full bg-gray-50 border ${
                    errors.title
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:ring-blue-500"
                  } text-gray-800 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all shadow-sm`}
                />
              </div>
              {errors.title && (
                <p className="text-red-500 flex items-center gap-1 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" /> {errors.title.message}
                </p>
              )}
            </div>

            {/* Ghi chú */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Ghi chú thêm (Tùy chọn)
              </label>
              <textarea
                {...register("note")}
                rows={5}
                placeholder="Yêu cầu đặc biệt của bạn (ví dụ: Bản song ngữ anh - việt, phần 2...)"
                className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={requestMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8 text-lg"
            >
              {requestMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang Gửi...
                </span>
              ) : (
                <>
                  <Send className="w-6 h-6" /> Gửi Yêu Cầu
                </>
              )}
            </button>
            <p className="text-center text-gray-500 text-sm mt-6 italic">
              Bạn có thể gửi yêu cầu miễn phí với tư cách thành viên.
            </p>
          </form>
        </div>
      </div>
    </MyLayout>
  );
}

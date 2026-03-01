"use client";

import { X, Check, Languages, Plus, Trash2, Globe, Lock } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Spanning from "@/app/components/spanning";
import Image from "next/image";
import { I_categories_data } from "@/app/lib/types/categories";
import { updateVideoAction } from "@/app/lib/actions/videos";
import { I_Video } from "@/app/lib/types/video";

type Props = {
  setClose: () => void;
  token: string;
  video: I_Video;
  data_categories: I_categories_data;
};

function AdminUpdateVideo({ setClose, token, video, data_categories }: Props) {
  const [formData, setFormData] = useState({
    title: video.title || "",
    original_title: video.original_title || "",
    description: video.description || "",
    level: video.level || "Intermediate",
    status: video.status || "private",
    author: video.author || "",
    country: video.country || "",
    release_year: video.release_year || new Date().getFullYear(),
    runtime: Number(video.runtime) || 0,
    thumbnail_url: video.thumbnail_url || "",
    backdrop_url: video.backdrop_url || "",
    stream_url: video.stream_url || "",
    category_ids:
      video.categories?.map((c: any) =>
        typeof c === "object" ? Number(c.id) : Number(c),
      ) || [],
  });

  // States for Image Uploads
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(
    video.thumbnail_url || "",
  );
  const [backdropPreview, setBackdropPreview] = useState<string>(
    video.backdrop_url || "",
  );

  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, form: FormData) => {
      // Chuyển đổi state sang FormData thực sự để gửi File + Text
      const finalForm = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "category_ids") {
          (value as number[]).forEach((id) =>
            finalForm.append("category_ids", id.toString()),
          );
        } else {
          finalForm.append(key, value.toString());
        }
      });

      if (thumbnailFile) finalForm.append("thumbnail_file", thumbnailFile);
      if (backdropFile) finalForm.append("backdrop_file", backdropFile);

      const actionResult = await updateVideoAction(
        Number(video.id),
        finalForm,
        token,
      );
      const { success, message, error } = actionResult;

      console.log(actionResult);
      finalForm.forEach((value, key) => {
        console.log(key, value);
      });

      if (success) {
        toast.success(message || "Cập nhật phim thành công!");
        router.refresh();
        setClose();
      } else {
        toast.error(error || "Cập nhật thất bại!");
      }

      return actionResult;
    },
    null,
  );

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          Chỉnh sửa phim:{" "}
          <span className="text-blue-600 truncate max-w-[400px]">
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

      <div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
        <form action={formAction} className="space-y-8 pb-10">
          {/* Section 1: Basic Information */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-blue-600 border-b border-blue-50 pb-3">
              <Globe size={20} />
              <h3 className="font-bold uppercase tracking-widest text-sm">
                Thông tin cơ bản
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase">
                  Tiêu đề phim
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase">
                  Tiêu đề gốc
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.original_title}
                  onChange={(e) =>
                    handleChange("original_title", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">
                Mô tả chi tiết
              </label>
              <textarea
                rows={5}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase">
                  Đạo diễn
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  value={formData.author}
                  onChange={(e) => handleChange("author", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase">
                  Quốc gia
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase">
                  Năm phát hành
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  value={formData.release_year}
                  onChange={(e) => handleChange("release_year", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  value={formData.runtime}
                  onChange={(e) => handleChange("runtime", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-blue-500 uppercase">
                  Steam URL (Source)
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-blue-100 bg-blue-50 rounded-xl text-blue-700 font-mono text-sm"
                  value={formData.stream_url}
                  onChange={(e) => handleChange("stream_url", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Configuration & Categories */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-50 pb-3">
              <Lock size={20} />
              <h3 className="font-bold uppercase tracking-widest text-sm">
                Cấu hình & Danh mục
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">
                      Trình độ
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) => handleChange("level", e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white transition-all font-medium"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">
                      Trạng thái
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white transition-all font-medium"
                    >
                      <option value="private">🔒 Riêng tư</option>
                      <option value="public">🔓 Công khai</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase">
                  Danh mục phim
                </label>
                <div className="flex flex-wrap gap-2 border border-gray-100 p-4 rounded-2xl min-h-[120px] bg-gray-50/30">
                  {data_categories.categories.map((cat) => {
                    const catId = Number(cat.id);
                    const isChecked = formData.category_ids.includes(catId);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          const ids = isChecked
                            ? formData.category_ids.filter((id) => id !== catId)
                            : [...formData.category_ids, catId];
                          handleChange("category_ids", ids);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          isChecked
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                            : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Media Uploads */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-rose-500 border-b border-rose-50 pb-3">
              <Plus size={20} />
              <h3 className="font-bold uppercase tracking-widest text-sm">
                Hình ảnh & Poster
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Thumbnail */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">
                    Thumbnail URL (Dọc)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-3 border border-gray-200 rounded-xl text-xs"
                      placeholder="Link ảnh poster..."
                      value={formData.thumbnail_url}
                      onChange={(e) =>
                        handleChange("thumbnail_url", e.target.value)
                      }
                    />
                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-1 transition-all">
                      <Plus size={14} /> Tải file
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setThumbnailFile(file);
                            setThumbnailPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                {thumbnailPreview && (
                  <div className="relative aspect-[3/4] w-40 mx-auto rounded-2xl overflow-hidden border-4 border-white shadow-xl rotate-1 group">
                    <Image
                      src={thumbnailPreview}
                      alt="Thumb"
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
              </div>

              {/* Backdrop */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-400 uppercase">
                    Backdrop URL (Ngang)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 p-3 border border-gray-200 rounded-xl text-xs"
                      placeholder="Link ảnh nền..."
                      value={formData.backdrop_url}
                      onChange={(e) =>
                        handleChange("backdrop_url", e.target.value)
                      }
                    />
                    <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold border border-indigo-100 flex items-center gap-1 transition-all">
                      <Plus size={14} /> Tải file
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBackdropFile(file);
                            setBackdropPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                {backdropPreview && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-4 border-white shadow-xl -rotate-1 group">
                    <Image
                      src={backdropPreview}
                      alt="Backdrop"
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Action Bar / Bottom Bar */}
          <div className="pt-4 sticky bottom-0 bg-gradient-to-t from-gray-50/90 to-transparent pb-4">
            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-blue-200 transition-all active:scale-[0.98] disabled:bg-gray-400"
            >
              {isPending ? (
                <Spanning />
              ) : (
                <>
                  <Check size={24} /> Lưu toàn bộ thay đổi
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminUpdateVideo;

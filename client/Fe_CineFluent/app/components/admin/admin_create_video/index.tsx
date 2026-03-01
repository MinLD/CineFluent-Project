"use client";

import { X, Youtube, Database, FileEdit, Check } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Spanning from "@/app/components/spanning";
import { importVideoAction, searchTMDBAction } from "@/app/lib/actions/videos";
import { I_categories_data } from "@/app/lib/types/categories";
import { Api_search_tmdb } from "@/app/lib/services/video";
import { Search } from "lucide-react";
import Image from "next/image";

type Props = {
  setClose: () => void;
  token: string;
  category_id?: number;
  data_categories?: I_categories_data;
};

type TabType = "youtube" | "tmdb" | "manual";

function AdminCreateVideo({
  setClose,
  token,
  category_id,
  data_categories,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>("youtube");
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [tmdbResults, setTmdbResults] = useState<any[]>([]);
  const [isSearchingTMDB, setIsSearchingTMDB] = useState(false);

  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [backdropFile, setBackdropFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    // ... (lines 28-51 kept as is)
    // Common
    level: "Intermediate",
    status: "private",
    category_ids: category_id ? [category_id] : ([] as number[]),
    source_type: "youtube" as string,

    // YouTube
    url: "",

    // TMDB
    tmdb_id: "",

    // Manual
    title: "",
    original_title: "",
    description: "",
    author: "",
    country: "",
    release_year: new Date().getFullYear(),
    runtime: 120,
    thumbnail_url: "",
    backdrop_url: "",
    stream_url: "",
  });

  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, form: FormData) => {
      // Build final FormData
      const dataForm = new FormData();
      dataForm.append("token", token);
      dataForm.append("source_type", activeTab);
      dataForm.append("level", formData.level);
      dataForm.append("status", formData.status);

      formData.category_ids.forEach((id) =>
        dataForm.append("category_ids", String(id)),
      );

      if (activeTab === "youtube") {
        if (!formData.url) {
          toast.warning("Vui lòng nhập link YouTube");
          return { success: false };
        }
        dataForm.append("url", formData.url);
      } else if (activeTab === "tmdb") {
        if (!formData.tmdb_id) {
          toast.warning("Vui lòng nhập TMDB ID");
          return { success: false };
        }
        dataForm.append("tmdb_id", formData.tmdb_id);
      } else {
        // Manual
        if (!formData.title || !formData.description || !formData.stream_url) {
          toast.warning("Vui lòng nhập ít nhất: Tiêu đề, Mô tả và Link phim");
          return { success: false };
        }
        dataForm.append("title", formData.title);
        dataForm.append("original_title", formData.original_title);
        dataForm.append("description", formData.description);
        dataForm.append("author", formData.author);
        dataForm.append("country", formData.country);
        dataForm.append("release_year", String(formData.release_year));
        dataForm.append("runtime", String(formData.runtime));
        dataForm.append("stream_url", formData.stream_url);

        if (posterFile) {
          dataForm.append("thumbnail_file", posterFile);
        } else {
          dataForm.append("thumbnail_url", formData.thumbnail_url);
        }

        if (backdropFile) {
          dataForm.append("backdrop_file", backdropFile);
        } else {
          dataForm.append("backdrop_url", formData.backdrop_url);
        }
      }

      const actionResult = await importVideoAction(prevState, dataForm);
      console.log("actionResult", actionResult);

      if (actionResult.success) {
        toast.success(actionResult.message);
        router.refresh();
        setClose();
      } else {
        toast.error(actionResult.error);
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

  const handleTMDBSearch = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!tmdbSearchQuery.trim()) {
      toast.warning("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }

    setIsSearchingTMDB(true);
    try {
      const res = await searchTMDBAction(tmdbSearchQuery, token);
      console.log("data in admin create video tmdb", res.data);
      if (res.success && res.code === 200) {
        setTmdbResults(res.data || []);
        if ((res.data || []).length === 0) {
          toast.info("Không tìm thấy kết quả nào");
        }
      } else {
        toast.error(res.error || "Lỗi khi tìm kiếm TMDB");
      }
    } catch (error: any) {
      console.error("TMDB Search Error:", error);
      toast.error("Lỗi kết nối máy chủ");
    } finally {
      setIsSearchingTMDB(false);
    }
  };

  const tabs = [
    { id: "youtube", name: "YouTube", icon: Youtube },
    { id: "tmdb", name: "TMDB Import", icon: Database },
    { id: "manual", name: "Thủ công", icon: FileEdit },
  ];

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Thêm phim mới</h2>
        <button
          onClick={setClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X size={28} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6 font-bold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Input Side */}
          <div className="space-y-4">
            {activeTab === "youtube" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Link YouTube
                </label>
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.url}
                  onChange={(e) => handleChange("url", e.target.value)}
                />
              </div>
            )}

            {activeTab === "tmdb" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Tìm kiếm phim trên TMDB
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Nhập tên phim... (Vd: Batman)"
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={tmdbSearchQuery}
                        onChange={(e) => setTmdbSearchQuery(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleTMDBSearch(e)
                        }
                      />
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleTMDBSearch}
                      disabled={isSearchingTMDB}
                      className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-black transition-colors flex items-center gap-2"
                    >
                      {isSearchingTMDB ? <Spanning /> : "Tìm"}
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {tmdbResults.length > 0 && (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg p-2 bg-white shadow-inner custom-scrollbar">
                    {tmdbResults.map((movie: any) => (
                      <div
                        key={movie.tmdb_id}
                        className={`flex items-center gap-3 p-2 rounded-lg transition-all border ${
                          formData.tmdb_id === String(movie.tmdb_id)
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <Image
                          width={48}
                          height={64}
                          src={
                            movie.poster_path
                              ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                              : "/img/no-image.png"
                          }
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded shadow-sm flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-800 truncate">
                            {movie.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {movie.year
                              ? new Date(movie.year).getFullYear()
                              : "N/A"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleChange("tmdb_id", String(movie.tmdb_id))
                          }
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            formData.tmdb_id === String(movie.tmdb_id)
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {formData.tmdb_id === String(movie.tmdb_id)
                            ? "Đã chọn"
                            : "Chọn"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Hoặc nhập TMDB ID trực tiếp
                  </label>
                  <input
                    type="text"
                    placeholder="Vd: 550"
                    className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.tmdb_id}
                    onChange={(e) => handleChange("tmdb_id", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 italic">
                    * Hệ thống sẽ tự động lấy mọi thông tin từ TMDB (Tiêu đề,
                    Ảnh, Mô tả...)
                  </p>
                </div>
              </div>
            )}

            {activeTab === "manual" && (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 font-semibold">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Tiêu đề gốc
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      value={formData.original_title}
                      onChange={(e) =>
                        handleChange("original_title", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 uppercase">
                    Mô tả
                  </label>
                  <textarea
                    rows={3}
                    className="w-full p-2 border border-gray-200 rounded-md text-sm"
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Đạo diễn
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      value={formData.author}
                      onChange={(e) => handleChange("author", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Quốc gia
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      value={formData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Năm PH
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      value={formData.release_year}
                      onChange={(e) =>
                        handleChange("release_year", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      Thời lượng (phút)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-200 rounded-md text-sm"
                      value={formData.runtime}
                      onChange={(e) => handleChange("runtime", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs uppercase font-bold text-blue-600">
                    Link phim (Stream URL)
                  </label>
                  <input
                    type="text"
                    placeholder="G-Drive ID hoặc Direct Link"
                    className="w-full p-2 border border-blue-200 rounded-md text-sm bg-blue-50"
                    value={formData.stream_url}
                    onChange={(e) => handleChange("stream_url", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      POSTER (UPLOAD ẢNH)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 p-1 border border-gray-200 rounded-md"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPosterFile(file);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 uppercase">
                      BACKDROP (UPLOAD ẢNH)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 p-1 border border-gray-200 rounded-md"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setBackdropFile(file);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Common Settings Side */}
          <div className="bg-gray-50 p-6 rounded-xl space-y-6">
            {/* Category Multi-select */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">
                Danh mục (Chọn nhiều)
              </label>
              <div className="flex flex-wrap gap-2 border border-gray-200 p-4 rounded-xl min-h-[120px] bg-white shadow-inner">
                {data_categories?.categories.map((category) => {
                  const id = Number(category.id);
                  const isChecked = formData.category_ids.includes(id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          category_ids: isChecked
                            ? prev.category_ids.filter((v) => v !== id)
                            : [...prev.category_ids, id],
                        }));
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                        isChecked
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                          : "bg-white border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
                      }`}
                    >
                      {isChecked && <Check size={12} strokeWidth={3} />}
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Select Level */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Trình độ
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleChange("level", e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              {/* Select Status */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="private">🔒 Riêng tư</option>
                  <option value="public">🔓 Công khai</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-md active:scale-[0.98] disabled:bg-gray-400 flex justify-center items-center gap-2"
              >
                {isPending ? (
                  <Spanning />
                ) : (
                  <>
                    <Check size={20} />
                    <span>Lưu và Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AdminCreateVideo;

"use client";

import Empty_State from "@/app/components/empty_state";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { I_Video, I_Videos_Data } from "@/app/lib/types/video";
import {
  Film,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Languages,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { Pagination } from "@/app/components/pagination";
import ModalConfirm from "@/app/components/modal_confirm";
import { toast } from "sonner";
import Modal_Show from "@/app/components/modal_show";
import { getVideosAction, deleteVideoAction } from "@/app/lib/actions/videos";
import AdminCreateVideo from "@/app/components/admin/admin_create_video";
import AdminUpdateVideo from "@/app/components/admin/admin_update_video";
import Image from "next/image";
import { I_categories_data } from "@/app/lib/types/categories";
import AdminSubtitlesModal from "../admin_subtitles_modal";

type Props = {
  data_videos: I_Videos_Data;
  data_categories: I_categories_data;
};

function Videos_Management({ data_videos, data_categories }: Props) {
  const { token } = useAuth();
  console.log("data_categories", data_categories);

  const [data, setData] = useState<I_Video[]>(data_videos.videos || []);
  const [pagination, setPagination] = useState(data_videos.pagination);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [editVideo, setEditVideo] = useState<I_Video | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [subtitlesVideo, setSubtitlesVideo] = useState<I_Video | null>(null);

  useEffect(() => {
    setData(data_videos.videos || []);
    setPagination(data_videos.pagination);
  }, [data_videos]);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const isFirstRender = useRef(true);

  const fetchFilteredVideos = async (page: number = 1) => {
    setLoading(true);
    try {
      const result = await getVideosAction(
        page,
        5,
        categoryFilter === "all" ? undefined : Number(categoryFilter),
        undefined, // release_year không dùng ở trang Admin
        sourceFilter === "all" ? undefined : sourceFilter,
        statusFilter === "all" ? undefined : statusFilter,
        searchQuery || undefined,
      );

      setData(result.videos);
      setPagination({
        current_page: page,
        total_pages: result.pagination.total_pages,
        total_items: result.pagination.total_items,
        per_page: 5,
        has_next: page < result.pagination.total_pages,
        has_prev: page > 1,
      });
    } catch (error) {
      console.error("Error fetching filtered videos:", error);
      toast.error("Đã có lỗi xảy ra khi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await deleteVideoAction(id, token);
      if (res.success) {
        toast.success("Xóa phim thành công!");
        fetchFilteredVideos(pagination.current_page);
      } else {
        toast.error(res.error || "Xóa phim thất bại!");
      }
    } catch (error) {
      toast.error("Đã có lỗi xảy ra!");
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  const handlePageChange = (page: number) => {
    fetchFilteredVideos(page);
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const debounce = setTimeout(() => {
      fetchFilteredVideos(1);
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchQuery, statusFilter, categoryFilter, sourceFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="relative w-full xl:max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên phim..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={20} />
          <span>Thêm phim mới</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
            Trạng thái
          </label>
          <select
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="public">Công khai (Public)</option>
            <option value="private">Riêng tư (Private)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
            Danh mục
          </label>
          <select
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Tất cả danh mục</option>
            {data_categories.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
            Nguồn video
          </label>
          <select
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">Tất cả nguồn</option>
            <option value="youtube">YouTube</option>
            <option value="local">Local (Drive)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Phim
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nguồn
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Trình độ
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">
                  Lượt xem
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((video) => (
                <tr
                  key={video.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-200">
                        {video.backdrop_url || video.thumbnail_url ? (
                          <Image
                            src={video.backdrop_url || video.thumbnail_url}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Film size={16} />
                          </div>
                        )}
                      </div>
                      <div className="max-w-[200px]">
                        <div
                          className="text-sm font-bold text-gray-900 truncate"
                          title={video.title}
                        >
                          {video.title}
                        </div>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={video.original_title}
                        >
                          {video.original_title || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        video.source_type === "youtube"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {video.source_type === "youtube" ? "YouTube" : "Local"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        video.status === "public"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {video.status === "public" ? "Công khai" : "Riêng tư"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {video.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                    {video.view_count.toLocaleString()}
                  </td>
                  <td className="flex items-center gap-2 justify-end px-6 py-4  whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      title="Chỉnh sửa"
                      onClick={() => setEditVideo(video)}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title="Xóa phim"
                      onClick={() => setConfirmDelete(video.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                      title="Quản lý Sub"
                      onClick={() => setSubtitlesVideo(video)}
                    >
                      <Languages size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && data.length === 0 && (
                <Empty_State title="phim" icon={Film} colSpan={6} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-end pt-4">
        <Pagination
          currentPage={pagination.current_page || 1}
          totalPages={pagination.total_pages || 1}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modals */}
      {isAddOpen && (
        <Modal_Show setClose={() => setIsAddOpen(false)}>
          <AdminCreateVideo
            setClose={() => setIsAddOpen(false)}
            token={token || ""}
            data_categories={data_categories}
          />
        </Modal_Show>
      )}

      {editVideo && (
        <Modal_Show setClose={() => setEditVideo(null)}>
          <AdminUpdateVideo
            setClose={() => setEditVideo(null)}
            token={token || ""}
            video={editVideo as any}
            data_categories={data_categories}
          />
        </Modal_Show>
      )}

      {confirmDelete && (
        <ModalConfirm
          setClose={() => setConfirmDelete(null)}
          handle={() => handleDeleteVideo(confirmDelete)}
        />
      )}

      {subtitlesVideo && (
        <Modal_Show setClose={() => setSubtitlesVideo(null)}>
          <AdminSubtitlesModal
            video={subtitlesVideo as any}
            token={token || ""}
            setClose={() => setSubtitlesVideo(null)}
          />
        </Modal_Show>
      )}
    </div>
  );
}

export default Videos_Management;

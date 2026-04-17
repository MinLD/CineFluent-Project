"use client";

import Empty_State from "@/app/components/empty_state";
import AdminCreateVideo from "@/app/components/admin/admin_create_video";
import AdminVideoAiModal from "@/app/components/admin/admin_video_ai_modal";
import AdminSubtitlesModal from "../admin_subtitles_modal";
import AdminUpdateVideo from "@/app/components/admin/admin_update_video";
import ModalConfirm from "@/app/components/modal_confirm";
import Modal_Show from "@/app/components/modal_show";
import { Pagination } from "@/app/components/pagination";
import { deleteVideoAction, getVideosAction } from "@/app/lib/actions/videos";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { I_categories_data } from "@/app/lib/types/categories";
import { I_Video, I_Videos_Data } from "@/app/lib/types/video";
import {
  Edit2,
  Film,
  Languages,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { toast } from "sonner";

type Props = {
  data_videos: I_Videos_Data;
  data_categories: I_categories_data;
};

function renderAiStatus(video: I_Video) {
  const analysis = video.ai_analysis;

  if (!analysis) {
    return (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-500">
        Chua phan tich
      </span>
    );
  }

  if (analysis.status === "FAILED") {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
        Loi AI
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
      {analysis.movie_cefr_range}
    </span>
  );
}

function Videos_Management({ data_videos, data_categories }: Props) {
  const { token } = useAuth();

  const [data, setData] = useState<I_Video[]>(data_videos.videos || []);
  const [pagination, setPagination] = useState(data_videos.pagination);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [editVideo, setEditVideo] = useState<I_Video | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [subtitlesVideo, setSubtitlesVideo] = useState<I_Video | null>(null);
  const [aiVideo, setAiVideo] = useState<I_Video | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const isFirstRender = useRef(true);

  useEffect(() => {
    setData(data_videos.videos || []);
    setPagination(data_videos.pagination);
  }, [data_videos]);

  useEffect(() => {
    if (!subtitlesVideo) return;

    const nextVideo = (data_videos.videos || []).find(
      (item) => item.id === subtitlesVideo.id,
    );
    if (nextVideo && nextVideo !== subtitlesVideo) {
      setSubtitlesVideo(nextVideo);
    }
  }, [data_videos, subtitlesVideo]);

  const fetchFilteredVideos = async (page: number = 1) => {
    setLoading(true);
    try {
      const result = await getVideosAction(
        page,
        5,
        categoryFilter === "all" ? undefined : Number(categoryFilter),
        undefined,
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
      toast.error("Da co loi xay ra khi tai du lieu!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await deleteVideoAction(id);
      if (res.success) {
        toast.success("Xoa phim thanh cong!");
        fetchFilteredVideos(pagination.current_page);
      } else {
        toast.error(res.error || "Xoa phim that bai!");
      }
    } catch {
      toast.error("Da co loi xay ra!");
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
      <div className="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
        <div className="relative w-full xl:max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Tim theo ten phim..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-colors hover:bg-blue-700"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus size={20} />
          <span>Them phim moi</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="ml-1 text-xs font-semibold uppercase text-gray-500">
            Trang thai
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tat ca trang thai</option>
            <option value="public">Cong khai</option>
            <option value="private">Rieng tu</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="ml-1 text-xs font-semibold uppercase text-gray-500">
            Danh muc
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Tat ca danh muc</option>
            {data_categories.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="ml-1 text-xs font-semibold uppercase text-gray-500">
            Nguon video
          </label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">Tat ca nguon</option>
            <option value="youtube">YouTube</option>
            <option value="local">Local (Drive)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Phim
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Nguon
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                  Trang thai
                </th>

                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">
                  Luot xem
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                  Hanh dong
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data.map((video) => (
                <tr
                  key={video.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100">
                        {video.backdrop_url || video.thumbnail_url ? (
                          <Image
                            src={video.backdrop_url || video.thumbnail_url}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <Film size={16} />
                          </div>
                        )}
                      </div>

                      <div className="max-w-[220px]">
                        <div
                          className="truncate text-sm font-bold text-gray-900"
                          title={video.title}
                        >
                          {video.title}
                        </div>
                        <div
                          className="truncate text-xs text-gray-500"
                          title={video.original_title}
                        >
                          {video.original_title || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        video.source_type === "youtube"
                          ? "border-red-100 bg-red-50 text-red-700"
                          : "border-blue-100 bg-blue-50 text-blue-700"
                      }`}
                    >
                      {video.source_type === "youtube" ? "YouTube" : "Local"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        video.status === "public"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {video.status === "public" ? "Cong khai" : "Rieng tu"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-600">
                    {video.view_count.toLocaleString()}
                  </td>

                  <td className="flex items-center justify-end gap-2 whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      className="p-1 text-gray-400 transition-colors hover:text-blue-600"
                      title="Chinh sua"
                      onClick={() => setEditVideo(video)}
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      className="p-1 text-gray-400 transition-colors hover:text-red-600"
                      title="Xoa phim"
                      onClick={() => setConfirmDelete(video.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      className="p-1 text-gray-400 transition-colors hover:text-indigo-600"
                      title="Quan ly subtitle"
                      onClick={() => setSubtitlesVideo(video)}
                    >
                      <Languages size={18} />
                    </button>
                    <button
                      className="p-1 text-gray-400 transition-colors hover:text-violet-600"
                      title="Xem AI"
                      onClick={() => setAiVideo(video)}
                    >
                      <Sparkles size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && data.length === 0 && (
                <Empty_State title="phim" icon={Film} colSpan={7} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Pagination
          currentPage={pagination.current_page || 1}
          totalPages={pagination.total_pages || 1}
          onPageChange={handlePageChange}
        />
      </div>

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

      {aiVideo && (
        <Modal_Show setClose={() => setAiVideo(null)}>
          <AdminVideoAiModal
            video={aiVideo}
            setClose={() => setAiVideo(null)}
          />
        </Modal_Show>
      )}
    </div>
  );
}

export default Videos_Management;

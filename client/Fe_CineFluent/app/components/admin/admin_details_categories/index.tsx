"use client";

import Empty_State from "@/app/components/empty_state";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { AlignStartVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { Pagination } from "@/app/components/pagination";
import { toast } from "sonner";
import { I_categories_data } from "@/app/lib/types/categories";
import Image from "next/image";
import ModalConfirm from "@/app/components/modal_confirm";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { useRouter } from "next/navigation";
import AdminCreateVideo from "@/app/components/admin/admin_create_video";
import AdminUpdateVideo from "@/app/components/admin/admin_update_video";

// Define Video Types locally or import if available
interface I_Video {
  id: number;
  title: string;
  thumbnail_url: string;
  level: string;
  slug: string;
  view_count: number;
  source_type: string;
  source_url: string;
  categories?: {
    id: number;
    name: string;
    slug: string;
  }[];
}

interface I_VideoData {
  videos: I_Video[];
  pagination: any;
}

type Props = {
  data_videos: I_VideoData;
  category_id: string;
  data_categories?: I_categories_data;
};

function VideoManagement({ data_videos, category_id, data_categories }: Props) {
  const { token } = useAuth();
  const router = useRouter();

  const titleTable = [
    { id: 1, name: "Ảnh" },
    { id: 2, name: "Tên Phim" },
    { id: 6, name: "Nguồn" }, // New Column
    { id: 3, name: "Cấp độ" },
    { id: 4, name: "Lượt xem" },
    { id: 5, name: "Hành Động" },
  ];

  const [data, setData] = useState<I_Video[]>(data_videos?.videos || []);
  const [pagination, setPagination] = useState(data_videos?.pagination);
  const [isLoading, setLoading] = useState<boolean>(!data_videos?.videos);
  const [ConfirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<I_Video | null>(null);
  const isFirstRender = useRef(true);

  // Filter State
  const [sourceFilter, setSourceFilter] = useState<"all" | "youtube" | "local">(
    "all",
  );

  // --- HANDLERS ---
  const handleEditVideo = (video: I_Video) => {
    setEditingVideo(video);
  };

  const currentSourceFilter = useRef<"all" | "youtube" | "local">("all");

  const handleFilterChange = (type: "all" | "youtube" | "local") => {
    setSourceFilter(type);
    currentSourceFilter.current = type;
    handlePageChange(1); // Reset to page 1 with new filter
  };

  // ... (handleCloseEdit, handleDeleteVideo remain same)
  const handleCloseEdit = () => {
    setEditingVideo(null);
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!token) {
      toast.error("Bạn không có quyền thực hiện hành động này.");
      setConfirmDelete(null);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${FeApiProxyUrl}/videos/${videoId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || "Xóa phim thành công");
        router.refresh();
        setData((prev) => prev.filter((v) => v.id !== videoId));
      } else {
        toast.error(result.message || "Xóa phim thất bại.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra phía client.");
    } finally {
      setLoading(false);
      setConfirmDelete(null);
    }
  };

  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const filter =
        currentSourceFilter.current === "all"
          ? ""
          : `&source_type=${currentSourceFilter.current}`;
      const url = `${FeApiProxyUrl}/videos?category_id=${category_id}&page=${page}&per_page=5${filter}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const newData = await response.json();
      console.log("New page data:", newData);

      const { videos, pagination } = newData.data;
      setData(videos || []);
      setPagination(pagination);
    } catch (error) {
      console.error("Error fetching new page data:", error);
      toast.error("Lỗi tải trang mới");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // When props change (e.g. navigation back/forward), reset or update
    // But local filter might deviate from prop data.
    // Usually props data is "all".
    // Let's just update if we are on "all" filter, or maybe just blindly update
    if (sourceFilter === "all") {
      setData(data_videos?.videos || []);
      setPagination(data_videos?.pagination);
    }
    console.log("♻️ Props data_videos updated:", data_videos);
  }, [data_videos]);

  if (isCreateOpen) {
    return (
      <AdminCreateVideo
        setClose={() => setCreateOpen(false)}
        token={token!}
        category_id={Number(category_id)}
        data_categories={data_categories}
      />
    );
  }

  if (editingVideo) {
    return (
      <AdminUpdateVideo
        setClose={handleCloseEdit}
        token={token!}
        video={editingVideo}
        data_categories={data_categories}
      />
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        {/* Filter Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => handleFilterChange("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              sourceFilter === "all"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => handleFilterChange("youtube")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              sourceFilter === "youtube"
                ? "bg-white text-red-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            YouTube
          </button>
          <button
            onClick={() => handleFilterChange("local")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              sourceFilter === "local"
                ? "bg-white text-green-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Local
          </button>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Thêm phim mới
        </button>
      </div>

      <div className="max-w-[100vw] overflow-x-auto bg-white shadow-md rounded-lg mt-4">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr>
              {titleTable.map((title) => (
                <th
                  key={title.id}
                  className="px-3 py-3 border-b border-gray-200 bg-gray-50 whitespace-nowrap font-semibold text-gray-700"
                >
                  {title.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-gray-200 divide-y">
            {data?.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {video.thumbnail_url ? (
                    <div className="relative w-24 h-14">
                      <Image
                        fill
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="object-cover rounded-md"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-14 bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-xs text-gray-500">No Image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 max-w-[300px] whitespace-normal">
                  <p className="font-medium text-gray-900 line-clamp-2">
                    {video.title}
                  </p>
                </td>

                {/* Source Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {video.source_type === "youtube" ? (
                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-semibold w-fit">
                      YouTube
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold w-fit">
                      Local
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold
                        ${
                          video.level === "Easy"
                            ? "bg-green-100 text-green-800"
                            : video.level === "Intermediate"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                  >
                    {video.level}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {video.view_count || 0}
                </td>

                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleEditVideo(video)}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => setConfirmDelete(video.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors cursor-pointer text-sm"
                  >
                    Xóa
                  </button>

                  {/* Confirm Delete Modal */}
                  {ConfirmDelete === video.id && (
                    <ModalConfirm
                      message={`video "${video.title}"`}
                      handle={() => handleDeleteVideo(video.id)}
                      setClose={() => setConfirmDelete(null)}
                    />
                  )}
                </td>
              </tr>
            ))}

            {/* ... Empty State and Loading rows ... */}

            {!isLoading && data?.length === 0 && (
              <Empty_State
                title="Không có video nào trong danh mục này"
                icon={AlignStartVertical}
                colSpan={titleTable.length}
              />
            )}

            {isLoading && (
              <tr>
                <td colSpan={titleTable.length} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <Pagination
          currentPage={pagination?.current_page || 1}
          totalPages={pagination?.total_pages || 1}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
}

export default VideoManagement;

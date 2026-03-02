"use client";

import Empty_State from "@/app/components/empty_state";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  I_data_reports,
  I_VideoReport,
} from "@/app/lib/types/admin_requests_reports";
import { CheckCircleIcon, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { Pagination } from "@/app/components/pagination";
import ModalConfirm from "@/app/components/modal_confirm";
import { toast } from "sonner";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { SSR_Reports } from "@/app/lib/data/requests_reports";

type Props = {
  data_reports: I_data_reports;
};

export default function Reports_Management({ data_reports }: Props) {
  const { token } = useAuth();

  const [data, setData] = useState<I_VideoReport[]>(data_reports.reports || []);
  const [pagination, setPagination] = useState(data_reports.pagination);
  const [isLoading, setLoading] = useState<boolean>(
    data_reports.reports === null,
  );
  const [ConfirmDelete, setConfirmDelete] = useState<number>(-1);

  const handleDeleteReport = async (id: number) => {
    setLoading(true);

    try {
      const res = await fetch(`${FeApiProxyUrl}/reports/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Xóa báo lỗi thất bại!");
        return;
      }
      toast.success("Xóa báo lỗi thành công!");
      handlePageChange(pagination.current_page);
    } catch (error) {
      console.log(error);
      toast.error("Đã có lỗi xảy ra!");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
      setConfirmDelete(-1);
    }
  };

  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const { reports, pagination: newPagination } = await SSR_Reports(
        page,
        pagination.per_page,
      );

      setData(reports || []);
      setPagination(newPagination);
    } catch (error) {
      console.error("Error fetching new page data:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  useEffect(() => {
    setData(data_reports.reports || []);
    setPagination(data_reports.pagination);
  }, [data_reports]);

  return (
    <>
      <div className="max-w-[100vw] overflow-x-auto bg-white shadow-md rounded-lg mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID / Người gửi
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Nguồn lỗi
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Loại lỗi
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                Mô tả chi tiết
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Thời gian
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.user_info}
                  </div>
                  <div className="text-xs text-gray-500">#{item.id}</div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold truncate max-w-[150px]"
                  title={item.video_title}
                >
                  {item.video_title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700`}
                  >
                    {item.issue_type === "SUBTILE_ERROR"
                      ? "LỖI PHỤ ĐỀ"
                      : item.issue_type === "VIDEO_ERROR"
                        ? "LỖI VIDEO"
                        : item.issue_type === "AUDIO_ERROR"
                          ? "LỖI ÂM THANH"
                          : "LỖI KHÁC"}
                  </span>
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                  title={item.description}
                >
                  {item.description || "Không có"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString("vi-VN")}
                </td>

                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2 justify-end">
                  <button
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                    onClick={() => setConfirmDelete(item.id)}
                    title="Xóa/Đánh dấu xong"
                  >
                    <Trash2 size={18} />
                  </button>
                  {ConfirmDelete === item.id && (
                    <div>
                      <ModalConfirm
                        setClose={() => setConfirmDelete(-1)}
                        handle={() => handleDeleteReport(item.id)}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && (!data || data.length === 0) && (
              <Empty_State
                title="báo lỗi video"
                icon={CheckCircleIcon}
                colSpan={6}
              />
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={pagination.current_page || 1}
            totalPages={pagination.total_pages || 1}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </>
  );
}

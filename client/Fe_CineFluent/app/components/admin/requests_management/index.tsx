"use client";

import Empty_State from "@/app/components/empty_state";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  I_data_requests,
  I_MovieRequest,
} from "@/app/lib/types/admin_requests_reports";
import { Trash2, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { Pagination } from "@/app/components/pagination";
import ModalConfirm from "@/app/components/modal_confirm";
import { toast } from "sonner";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { SSR_Requests } from "@/app/lib/data/requests_reports";

type Props = {
  data_requests: I_data_requests;
};

export default function Requests_Management({ data_requests }: Props) {
  const { token } = useAuth();

  const [data, setData] = useState<I_MovieRequest[]>(
    data_requests.requests || [],
  );
  const [pagination, setPagination] = useState(data_requests.pagination);
  const [isLoading, setLoading] = useState<boolean>(
    data_requests.requests === null,
  );
  const [ConfirmDelete, setConfirmDelete] = useState<number>(-1);

  const handleDeleteRequest = async (id: number) => {
    setLoading(true);

    try {
      const res = await fetch(`${FeApiProxyUrl}/requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Xóa yêu cầu thất bại!");
        return;
      }
      toast.success("Xóa yêu cầu thành công!");
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
      const { requests, pagination: newPagination } = await SSR_Requests(
        page,
        pagination.per_page,
      );

      setData(requests || []);
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
    setData(data_requests.requests || []);
    setPagination(data_requests.pagination);
  }, [data_requests]);

  return (
    <>
      <div className="max-w-[100vw] overflow-x-auto bg-white shadow-md rounded-lg mt-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Người yêu cầu
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Tên Phim
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                Ghi chú
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Ngày gửi
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{item.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.user_info}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                  {item.title}
                </td>
                <td
                  className="px-6 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                  title={item.note}
                >
                  {item.note || "Không có"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString("vi-VN")}
                </td>

                <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2 justify-end">
                  <button
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                    onClick={() => setConfirmDelete(item.id)}
                    title="Xóa yêu cầu"
                  >
                    <Trash2 size={18} />
                  </button>
                  {ConfirmDelete === item.id && (
                    <div>
                      <ModalConfirm
                        setClose={() => setConfirmDelete(-1)}
                        handle={() => handleDeleteRequest(item.id)}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && (!data || data.length === 0) && (
              <Empty_State title="yêu cầu phim" icon={Video} colSpan={6} />
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

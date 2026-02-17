"use client";

import Empty_State from "@/app/components/empty_state";
import AdminCreateUser from "@/app/components/admin/admin_create_user";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { I_data_users, Ty_User } from "@/app/lib/types/users";
import { AlignStartVertical, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Pagination } from "@/app/components/pagination";
import AdminViewUser from "@/app/components/admin/admin_view_user";
import ModalConfirm from "@/app/components/modal_confirm";
import axios from "axios";
import { toast } from "sonner";
import { Api_Delete_User } from "@/app/lib/services/user";
import { I_categories_data, I_category } from "@/app/lib/types/categories";
import { set } from "lodash";
import Image from "next/image";
import AdminCreateCategories from "@/app/components/admin/admin_create_categories";
import Modal_Show from "@/app/components/modal_show";
import AdminUpdateCategories from "@/app/components/admin/admin_update_categories";
import AdminDetailsCategories from "@/app/components/admin/admin_details_categories";
import Link from "next/link";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";

type Props = {
  data_categories: I_categories_data;
};
function CategoriesManagement({ data_categories }: Props) {
  const { token } = useAuth();
  const titleTable = [
    { id: 1, name: "Ảnh danh mục" },
    { id: 2, name: "Tên danh mục" },
    { id: 3, name: "Slug danh mục" },
    { id: 4, name: "Mô tả danh mục" },
    { id: 5, name: "Hành Động" },
  ];

  const [data, setData] = useState<I_category[]>(
    data_categories.categories || [],
  );
  const [pagination, setPagination] = useState(data_categories.pagination);
  const [isLoading, setLoading] = useState<boolean>(
    data_categories.categories === null,
  );
  const [isEdit, setIsEdit] = useState<number>(-1);
  const [ConfirmDelete, setConfirmDelete] = useState<string>("");
  const [isDetails, setIsDetails] = useState<number>(-1);
  const [isAdd, setAdd] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isFirstRender = useRef(true);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${FeApiProxyUrl}/categories/search?keyword=${searchQuery}&page=1&per_page=3`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const newData = await response.json();
      console.log(newData);
      setData(newData.categories || []);
      setPagination(newData.pagination);
    } catch (error) {
      console.error("Error fetching new page data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setLoading(true);

    try {
      const res = await fetch(`${FeApiProxyUrl}/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      });
      if (!res.ok) {
        console.log(res);
        toast.error("Xóa danh mục thất bại!");
        return;
      }
      console.log(res);
      toast.success("Xóa danh mục thành công!");
      handlePageChange(pagination.current_page);
    } catch (error) {
      console.log(error);
      toast.error("Đã có lỗi xảy ra khi xóa danh mục!");
    } finally {
      setLoading(false);
      setConfirmDelete("-1");
    }
  };

  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `${FeApiProxyUrl}/categories/search?keyword=${searchQuery}&page=${page}&per_page=3`
        : `${FeApiProxyUrl}/categories?page=${page}&per_page=3`;
      const response = await fetch(url);
      console.log("Fetching page:", url);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const { categories, pagination } = await response.json();
      console.log("newData", { categories, pagination });
      setData(categories || []);
      setPagination(pagination);
    } catch (error) {
      console.error("Error fetching new page data:", error);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const debounce = setTimeout(() => {
      if (searchQuery) {
        handleSearch();
      } else {
        setData(data_categories.categories || []);
        setPagination(data_categories.pagination);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);
  useEffect(() => {
    setData(data_categories.categories || []);
    setPagination(data_categories.pagination);
    console.log("♻️ Props  data_categories updated:", data_categories);
  }, [data_categories]);

  return (
    <>
      <div className="flex flex-col xl:flex-row justify-between mb-6 gap-4">
        <div className="relative  sm:w-2/3 w-4/5">
          <input
            type="text"
            id="searchInput"
            placeholder="Tìm kiếm người dùng..."
            className="w-full p-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <svg
            className="w-5 h-5 absolute left-3 top-3 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          className="w-3/4 sm:w-2/5  bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer"
          onClick={() => setAdd(true)}
        >
          Thêm danh mục
        </button>
        {isAdd && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={() => setAdd(false)}
          >
            <div
              className="bg-white p-4 w-[800px] h-auto rounded-xl shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <AdminCreateCategories
                setClose={() => setAdd(false)}
                token={token || ""}
              />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-[100vw] overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-left border-collapse">
          <thead>
            <tr>
              {titleTable.map((title) => (
                <th
                  key={title.id}
                  className="px-3 py-3 border-b border-gray-200 bg-gray-50 whitespace-nowrap"
                >
                  {title.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-gray-200 divide-y">
            <>
              {data?.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {category.avatar_url ? (
                      <Image
                        width={100}
                        height={100}
                        src={category.avatar_url}
                        alt={category.name}
                        className="w-14 h-14 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-xs text-gray-500">No Image</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 max-w-[200px] whitespace-normal break-words">
                    {category.name || ""}
                  </td>
                  <td className="px-6 py-4 max-w-[200px] whitespace-normal break-words">
                    {category.slug || ""}
                  </td>
                  <td className="px-6 py-4 max-w-[200px] whitespace-normal break-words">
                    {category.description || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    {/* Temporarily hidden - Skills being replaced with Videos */}
                    {/* <Link
                      href={`/admin?tab=Skills_Management&categoryId=${category.id}&nameCategory=${category.name}`}
                      className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 cursor-pointer inline-block text-sm"
                    >
                      Chi tiết
                    </Link> */}
                    <button
                      onClick={() => setConfirmDelete(category.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 cursor-pointer"
                    >
                      Xóa
                    </button>
                    <button
                      onClick={() => setIsEdit(parseInt(category.id))}
                      className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 cursor-pointer"
                    >
                      Sửa
                    </button>
                    {ConfirmDelete === category.id && (
                      <ModalConfirm
                        message="danh mục"
                        handle={() => handleDeleteUser(category?.id || "")}
                        setClose={() => setConfirmDelete("-1")}
                      />
                    )}
                    {isEdit === parseInt(category.id) && (
                      <>
                        <Modal_Show setClose={() => setIsEdit(-1)}>
                          <AdminUpdateCategories
                            category={category}
                            setClose={() => setIsEdit(-1)}
                            token={token || ""}
                          />
                        </Modal_Show>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </>

            {!isLoading && data?.length === 0 && (
              <Empty_State
                title="Không có danh mục thử thách nào"
                icon={AlignStartVertical}
                colSpan={titleTable.length}
              />
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex justify-end">
        <Pagination
          currentPage={pagination?.current_page || 1}
          totalPages={pagination?.total_pages || 1}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
}

export default CategoriesManagement;

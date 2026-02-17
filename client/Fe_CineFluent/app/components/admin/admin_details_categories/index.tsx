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
import { toast } from "sonner";
import {
  I_categories_data,
  I_category,
  I_skill,
  I_skills_data,
} from "@/app/lib/types/categories";
import { set } from "lodash";
import Image from "next/image";
import AdminCreateCategories from "@/app/components/admin/admin_create_categories";
import Modal_Show from "@/app/components/modal_show";
import AdminUpdateCategories from "@/app/components/admin/admin_update_categories";
import AdminDetailsCategories from "@/app/components/admin/admin_details_categories";
import Link from "next/link";
import AdminCreateSkill from "@/app/components/admin/admin_create_skill";
import AdminUpdateSkill from "@/app/components/admin/admin_update_skill";
import { deleteSkillAction } from "@/app/lib/actions/categories";
import { useRouter } from "next/navigation";
import ModalConfirm from "@/app/components/modal_confirm";
import { FeApiProxyUrl } from "@/app/lib/services/api_client";

type Props = {
  data_skills: I_skills_data;
  category_id: string;
  data_categories?: I_categories_data;
};
function SkillManagement({ data_skills, category_id, data_categories }: Props) {
  const { token } = useAuth();
  const titleTable = [
    { id: 1, name: "Ảnh danh mục" },
    { id: 2, name: "Tên danh mục" },
    { id: 4, name: "Mô tả danh mục" },
    { id: 5, name: "Hành Động" },
  ];

  const [data, setData] = useState<I_skill[]>(data_skills.skills || []);
  const [pagination, setPagination] = useState(data_skills.pagination);
  const [isLoading, setLoading] = useState<boolean>(
    data_skills.skills === null,
  );
  const [isEdit, setIsEdit] = useState<number>(-1);
  const [ConfirmDelete, setConfirmDelete] = useState<string>("");
  const [isAdd, setAdd] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isFirstRender = useRef(true);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/${FeApiProxyUrl}/skills/search?categoryId=${category_id}&keyword=${searchQuery}&page=1&per_page=3`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const newData = await response.json();
      console.log(newData);
      setData(newData.skills || []);
      setPagination(newData.pagination);
    } catch (error) {
      console.error("Error fetching new page data:", error);
    } finally {
      setLoading(false);
    }
  };
  const router = useRouter();
  const handleDeleteSkill = async (skillId: string) => {
    if (!token) {
      toast.error("Bạn không có quyền thực hiện hành động này.");
      setConfirmDelete("");

      return;
    }
    setLoading(true);
    try {
      const result = await deleteSkillAction(skillId, token);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || "Xóa kỹ năng thất bại.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã có lỗi xảy ra phía client.");
    } finally {
      setLoading(false);
      setConfirmDelete("");
    }
  };

  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/${FeApiProxyUrl}/categories/search?keyword=${searchQuery}&page=${page}&per_page=3`
        : `/${FeApiProxyUrl}/categories/${category_id}/skills?page=${page}&per_page=3`;
      const response = await fetch(url);
      console.log("Fetching page:", url);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const newData = await response.json();
      console.log("New page data:", newData);
      const { skills, pagination } = newData.data;
      console.log("newData", { skills, pagination });
      setData(skills || []);
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
        setData(data_skills.skills || []);
        setPagination(data_skills.pagination);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);
  useEffect(() => {
    setData(data_skills.skills || []);
    setPagination(data_skills.pagination);
    console.log("♻️ Props  data_skills updated:", data_skills);
  }, [data_skills]);

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
          Thêm kỹ năng
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
              <AdminCreateSkill
                setClose={() => setAdd(false)}
                token={token || ""}
                category_id={category_id || ""}
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
                    {category.description || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
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
                        message="kỹ năng"
                        handle={() => handleDeleteSkill(category?.id || "")}
                        setClose={() => setConfirmDelete("-1")}
                      />
                    )}
                    {isEdit === parseInt(category.id) && (
                      <>
                        <Modal_Show setClose={() => setIsEdit(-1)}>
                          <AdminUpdateSkill
                            setClose={() => setIsEdit(-1)}
                            skills={category}
                            token={token || ""}
                            data_categories={data_categories}
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

export default SkillManagement;

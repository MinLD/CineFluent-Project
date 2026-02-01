"use client";

import Empty_State from "@/app/components/empty_state";
import AdminCreateUser from "@/app/components/admin/admin_create_user";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { I_data_users, Ty_User } from "@/app/lib/types/users";
import { Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "react-loading-skeleton/dist/skeleton.css";
import { Pagination } from "@/app/components/pagination";
import AdminViewUser from "@/app/components/admin/admin_view_user";
import ModalConfirm from "@/app/components/modal_confirm";
import { toast } from "sonner";
import Modal_Show from "@/app/components/modal_show";

type Props = {
  data_users: I_data_users;
};

function Users_Management({ data_users }: Props) {
  const { token } = useAuth();
  const titleTable = [
    { id: 1, name: "Tên người dùng" },
    { id: 2, name: "Email" },
    { id: 6, name: "Status" },
    { id: 7, name: "Vai Trò" },
    { id: 8, name: "Hành Động" },
  ];

  const [data, setData] = useState<Ty_User[]>(data_users.users || []);
  const [pagination, setPagination] = useState(data_users.pagination);
  const [isLoading, setLoading] = useState<boolean>(data_users.users === null);
  const [isEditProfile, setIsEditProfile] = useState<number>(-1);
  const [ConfirmDelete, setConfirmDelete] = useState<string>("");
  const [AddUser, setAddUser] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isFirstRender = useRef(true);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?keyword=${searchQuery}`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const newData = await response.json();
      setData(newData.users);
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
      const res = await fetch(`/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "DELETE",
      });
      if (!res.ok) {
        console.log(res);
        toast.error("Xóa người dùng thất bại!");
        return;
      }
      console.log(res);
      toast.success("Xóa người dùng thành công!");
      handlePageChange(pagination.current_page);
    } catch (error) {
      console.log(error);
      toast.error("Đã có lỗi xảy ra!");
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
      setConfirmDelete("-1");
    }
  };

  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const url = searchQuery
        ? `/api/users/search?keyword=${searchQuery}&page=${page}&per_page=4`
        : `/api/users?page=${page}&per_page=4`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const newData = await response.json();
      console.log("♻️ Fetched new page data:", newData.users);
      setData(newData?.users);
      setPagination(newData?.pagination);
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
        setData(data_users.users || []);
        setPagination(data_users.pagination);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);
  useEffect(() => {
    setData(data_users.users || []);
    setPagination(data_users.pagination);
    console.log("♻️ Props data_users updated:", data_users);
  }, [data_users]);

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
          onClick={() => setAddUser(true)}
        >
          Thêm Người Dùng
        </button>
        {AddUser && (
          <Modal_Show setClose={() => setAddUser(false)}>
            <AdminCreateUser
              setClose={() => setAddUser(false)}
              token={token || ""}
            />
          </Modal_Show>
        )}
      </div>

      <div className="max-w-[100vw] overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {titleTable?.map((item) => (
                <th
                  key={item.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {item.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((item, k) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item?.profile?.fullname || "Chưa cập nhật!"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item?.email || "chưa cập nhật!"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item?.status === "active"
                        ? "bg-green-100 text-green-700"
                        : item?.status === "banned"
                          ? "bg-red-100 text-red-700"
                          : item?.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item?.status ? item.status.toUpperCase() : "ACTIVE"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item?.roles[0]?.name.toUpperCase() || "chưa cập nhật!"}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    className="text-blue-500 hover:text-blue-700 mr-2 cursor-pointer"
                    onClick={() => {
                      setIsEditProfile(k);
                    }}
                  >
                    Xem
                  </button>
                  <button
                    className={`text-red-500 hover:text-red-700 cursor-pointer ${
                      item?.roles[0]?.name === "admin"
                        ? "hover:cursor-not-allowed"
                        : ""
                    }`}
                    onClick={() => setConfirmDelete(item?.id)}
                    disabled={item?.roles[0]?.name === "admin"}
                  >
                    Xóa
                  </button>
                  {ConfirmDelete === item?.id && (
                    <div>
                      <ModalConfirm
                        setClose={() => setConfirmDelete("-1")}
                        handle={() => handleDeleteUser(item?.id || "")}
                      />
                    </div>
                  )}

                  {isEditProfile === k && (
                    <>
                      <Modal_Show setClose={() => setIsEditProfile(-1)}>
                        <AdminViewUser
                          setClose={() => setIsEditProfile(-1)}
                          token={token || ""}
                          user={item}
                        />
                      </Modal_Show>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <Empty_State
                title="người dùng"
                icon={Users}
                colSpan={titleTable.length}
              />
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex justify-end">
        <Pagination
          currentPage={pagination.current_page || 1}
          totalPages={pagination.total_pages || 1}
          onPageChange={handlePageChange}
        />
      </div>
    </>
  );
}

export default Users_Management;

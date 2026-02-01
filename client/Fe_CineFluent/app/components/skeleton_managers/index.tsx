import Skeleton from "react-loading-skeleton";

export function SkeletonManagers() {
  return (
    <div className="w-full">
      {/* 1. Phần Toolbar: Ô Tìm Kiếm + Nút Thêm */}
      <div className="flex flex-col xl:flex-row justify-between mb-6 gap-4">
        {/* Giả lập Ô Input Search */}
        <div className="relative sm:w-2/3 w-4/5">
          <Skeleton height={45} borderRadius="0.5rem" />
        </div>

        {/* Giả lập Nút Thêm User (Màu xanh trong ảnh) */}
        <button className="w-3/4 sm:w-2/5" disabled>
          <Skeleton height={45} borderRadius="0.5rem" />
        </button>
      </div>

      {/* 2. Phần Bảng Dữ Liệu */}
      <div className="max-w-[100vw] overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          {/* Header Bảng */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4" key={0}>
                <Skeleton width={120} />
              </th>{" "}
              {/* Tên người dùng */}
              <th className="px-6 py-4" key={1}>
                <Skeleton width={180} />
              </th>{" "}
              {/* Email */}
              <th className="px-6 py-4" key={2}>
                <Skeleton width={60} />
              </th>{" "}
              {/* Vai trò */}
              <th className="px-6 py-4" key={3}>
                <Skeleton width={100} />
              </th>{" "}
              {/* Trạng thái */}
              <th className="px-6 py-4" key={4}>
                <Skeleton width={80} />
              </th>{" "}
              {/* Hành động */}
            </tr>
          </thead>

          {/* Body Bảng: Render 5 dòng skeleton */}
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap" key={0}>
                  <Skeleton width={100} height={20} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap" key={1}>
                  <Skeleton width={220} height={20} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap" key={2}>
                  <Skeleton width={40} height={20} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap" key={3}>
                  {/* Giả lập cái Dropdown Select (Cao hơn text bình thường) */}
                  <Skeleton width={120} height={36} borderRadius={6} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap" key={4}>
                  {/* Giả lập 2 nút Xem (Xanh) và Xóa (Đỏ) */}
                  <div className="flex gap-3">
                    <Skeleton width={35} height={20} />
                    <Skeleton width={35} height={20} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. Phần Pagination (Góc phải dưới) */}
      <div className="mt-4 flex justify-end gap-2 px-2">
        <Skeleton width={32} height={32} borderRadius={4} />
        <Skeleton width={32} height={32} borderRadius={4} />
        <Skeleton width={32} height={32} borderRadius={4} />
        <Skeleton width={32} height={32} borderRadius={4} />
      </div>
    </div>
  );
}

import { SearchX } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-blue-100 p-6">
        <SearchX className="h-16 w-16 text-blue-600" />
      </div>
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-semibold text-gray-800">
        Không tìm thấy trang
      </h2>
      <p className="mt-4 max-w-md text-base text-gray-600">
        Rất tiếc, trang bạn đang tìm kiếm có thể đã bị di chuyển, xóa bỏ hoặc
        không tồn tại. Vui lòng kiểm tra lại đường dẫn.
      </p>
      <Link href="/">
        <button className="mt-8 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Quay về Trang chủ
        </button>
      </Link>
    </div>
  );
}

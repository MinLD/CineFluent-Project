// components/Pagination.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Hàm tiện ích để tạo một mảng số
const range = (start: number, end: number) => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  /**
   * Tạo ra danh sách các trang để hiển thị, bao gồm dấu '...'
   * Logic: Hiển thị tối đa 5 nút số.
   * - Nếu ở gần đầu: 1 2 3 4 5 ... 20
   * - Nếu ở gần cuối: 1 ... 16 17 18 19 20
   * - Nếu ở giữa:   1 ... 7 8 9 ... 20
   */
  const getPaginationNumbers = (): (number | "...")[] => {
    const maxPagesToShow = 5; // Số lượng nút số tối đa
    const pageBuffer = Math.floor(maxPagesToShow / 2); // 2

    // Trường hợp 1: Tổng số trang ít, không cần '...'
    if (totalPages <= maxPagesToShow + 2) {
      // (e.g., <= 7 pages)
      return range(1, totalPages);
    }

    let pages: (number | "...")[] = [];

    // Trường hợp 2: Gần trang đầu (hiện tại là 1, 2, hoặc 3)
    if (currentPage <= pageBuffer + 1) {
      pages = [...range(1, maxPagesToShow), "...", totalPages];
    }
    // Trường hợp 3: Gần trang cuối (hiện tại là total-2, total-1, total)
    else if (currentPage >= totalPages - pageBuffer) {
      pages = [1, "...", ...range(totalPages - maxPagesToShow + 1, totalPages)];
    }
    // Trường hợp 4: Ở giữa
    else {
      pages = [
        1,
        "...",
        ...range(currentPage - pageBuffer, currentPage + pageBuffer),
        "...",
        totalPages,
      ];
    }

    return pages;
  };

  const pages = getPaginationNumbers();

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | "...") => {
    if (typeof page === "number") {
      onPageChange(page);
    }
  };

  // Định nghĩa style cho các nút
  const baseButton =
    "relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors border";
  const activeStyle = "z-10 bg-indigo-50 border-indigo-500 text-indigo-600";
  const defaultStyle =
    "bg-white border-gray-300 text-gray-500 hover:bg-gray-50";
  const disabledStyle =
    "bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between bg-white py-3">
      {/* Phần này là text hiển thị (ví dụ: "Đang xem trang 5 / 20").
        Bạn có thể thêm vào nếu cần, ở đây tôi tập trung vào các nút.
      */}

      <div>
        <nav
          className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm"
          aria-label="Pagination"
        >
          {/* Nút Previous */}
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`cursor-pointer relative inline-flex items-center rounded-l-md px-2 py-2 text-sm font-medium ${
              currentPage === 1 ? disabledStyle : defaultStyle
            }`}
          >
            <span className="sr-only">Previous</span>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Các nút số */}
          {pages.map((page, index) =>
            typeof page === "number" ? (
              // Nút số
              <button
                key={index}
                onClick={() => handlePageClick(page)}
                className={`${baseButton} cursor-pointer ${
                  page === currentPage ? activeStyle : defaultStyle
                }`}
              >
                {page}
              </button>
            ) : (
              // Dấu '...'
              <span
                key={index}
                className={`${baseButton} ${defaultStyle} cursor-default`}
              >
                ...
              </span>
            )
          )}

          {/* Nút Next */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`cursor-pointer relative inline-flex items-center rounded-r-md px-2 py-2 text-sm font-medium ${
              currentPage === totalPages ? disabledStyle : defaultStyle
            }`}
          >
            <span className="sr-only">Next</span>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;

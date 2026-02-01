"use client";

import { useState, useEffect } from "react";
import { fadeInUp, staggerContainer } from "@/app/lib/Animation";
import { motion } from "framer-motion";
import { I_category } from "@/app/lib/types/categories";
import CardCategories from "../card_categories";
import { I_pagination } from "@/app/lib/types/stores";
import { loadMoreCategoriesAction } from "@/app/lib/actions/categories";
import { Loader2, ChevronDown, ArrowLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  categories?: I_category[];
  pagination?: I_pagination;
};

const AllCategories = ({
  categories: initialCategories,
  pagination: initialPagination,
}: Props) => {
  const router = useRouter();
  const [categories, setCategories] = useState<I_category[]>(
    initialCategories || [],
  );
  const [pagination, setPagination] = useState<I_pagination | undefined>(
    initialPagination,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFilterChange(searchQuery, sortOrder);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFilterChange = async (search: string, sort: string) => {
    setIsLoading(true);
    try {
      // Always reset to page 1 when filtering
      const res = await loadMoreCategoriesAction(1, 12, search, sort);

      if (res.success && res.data) {
        setCategories(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to filter categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortOrder(newSort);
    handleFilterChange(searchQuery, newSort);
  };

  const handleLoadMore = async () => {
    if (!pagination || isLoading) return;

    setIsLoading(true);
    try {
      const nextPage = pagination.current_page + 1;
      const res = await loadMoreCategoriesAction(
        nextPage,
        pagination.per_page,
        searchQuery,
        sortOrder,
      );

      if (res.success && res.data) {
        setCategories((prev) => [...prev, ...res.data]);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to load more categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMore = pagination
    ? pagination.current_page < pagination.total_pages
    : false;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section with Back Button */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 mr-4 rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors duration-200 group"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
        </button>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="flex-1 text-center"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-2xl font-bold text-gray-900 md:text-3xl lg:text-4xl"
          >
            Tất cả kỹ năng
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="mt-2 text-md text-gray-500 md:text-lg"
          >
            Danh sách đầy đủ các kỹ năng và danh mục hiện có
          </motion.p>
        </motion.div>

        {/* Placeholder for balance */}
        <div className="w-14"></div>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        {/* Search */}
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Tìm kiếm kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className="w-full md:w-auto min-w-[200px]">
          <div className="relative">
            <select
              value={sortOrder}
              onChange={handleSortChange}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg border bg-white appearance-none cursor-pointer"
            >
              <option value="">Sắp xếp mặc định</option>
              <option value="name_asc">Tên (A-Z)</option>
              <option value="name_desc">Tên (Z-A)</option>
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cate, index) => (
            <motion.div
              key={`${cate.id}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <CardCategories categories={cate} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">
            Không tìm thấy kết quả nào phù hợp.
          </p>
        </div>
      )}

      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="group px-8 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-full shadow-sm hover:shadow-md hover:border-blue-400 hover:text-blue-600 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang tải thêm...
              </>
            ) : (
              <>
                Xem thêm
                <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform duration-300" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AllCategories;

"use client";

import React from "react";
import Link from "next/link";
import { Film } from "lucide-react";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function MovieRequest({ isHeader = false }: { isHeader?: boolean }) {
  const { userId, token } = useAuth();
  const router = useRouter();

  const handleAuthCheck = (e: React.MouseEvent) => {
    if (!userId || !token) {
      e.preventDefault();
      toast.warning("Vui lòng đăng nhập để yêu cầu phim nổi bật nhé!");
      router.push("/login");
    }
  };

  return (
    <Link
      href="/request-movie"
      onClick={handleAuthCheck}
      className={
        isHeader
          ? "flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 hover:text-blue-400 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
          : "flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 border border-gray-200 shadow-sm rounded-xl transition-all duration-300 text-gray-700 font-medium group"
      }
    >
      <Film
        className={
          isHeader
            ? "w-4 h-4"
            : "w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform"
        }
      />
      <span className={isHeader ? "" : "text-gray-700"}>
        {isHeader
          ? "Yêu Cầu Phim"
          : "Bạn không tìm thấy phim yêu thích? Yêu cầu ngay!"}
      </span>
    </Link>
  );
}

"use client";

import UserMenu from "@/app/components/user_menu";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useNav } from "@/app/lib/hooks/useNav";
import { Menu } from "lucide-react";
import Link from "next/link";
// Đã xóa import react-loading-skeleton để dùng Tailwind cho nhẹ

export default function UserAuthSection() {
  const { profile_user, isLoading } = useAuth();

  return (
    <div className="flex items-center space-x-4">
      {isLoading ? (
        <div className="hidden sm:flex items-center space-x-3 animate-pulse">
          <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" />

          <div className="h-8 w-20 rounded bg-gray-300 dark:bg-gray-600" />
        </div>
      ) : !profile_user ? (
        <div className="hidden sm:flex items-center space-x-2">
          <Link href="/login">
            <button className="cursor-pointer px-3 py-1 font-medium text-gray-600 transition-all hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400">
              Đăng nhập
            </button>
          </Link>
          <Link href="/auth/register">
            <button className="cursor-pointer rounded-sm bg-blue-600 px-3 py-1 text-white transition-all hover:bg-blue-800">
              Đăng ký
            </button>
          </Link>
        </div>
      ) : (
        <div className="hidden md:flex">
          <UserMenu user={profile_user} />
        </div>
      )}
    </div>
  );
}

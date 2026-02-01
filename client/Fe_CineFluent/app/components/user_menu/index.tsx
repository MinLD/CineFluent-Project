"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  LogOut,
  Settings,
  CreditCard,
  BookOpen,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Ty_User } from "@/app/lib/types/users";
import { AnimatePresence, motion } from "framer-motion";

export default function UserMenu({ user }: { user: Ty_User }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Logic: Click ra ngoài thì tự đóng menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hàm lấy chữ cái đầu để làm Avatar mặc định nếu không có ảnh
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative z-10" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 pl-2 pr-1 py-1 rounded-full transition-all duration-300 hover:bg-gray-100 dark:hover:bg-zinc-800 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      >
        <div className="text-right hidden md:block">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {user.profile.fullname}
          </p>
          <div className="flex items-center justify-end gap-1">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
              {user.profile.total_points} PTS
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-zinc-900 shadow-sm group-hover:shadow-md transition-all duration-300 ring-1 ring-gray-200 dark:ring-gray-700">
            {user.profile.avatar_url ? (
              <Image
                src={user.profile.avatar_url}
                alt={user.profile.fullname}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {getInitials(user.profile.fullname)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 bg-white dark:bg-zinc-900 rounded-full p-0.5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-zinc-900"></div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="z-80 absolute right-0 mt-3 w-72 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden ring-1 ring-black/5"
          >
            {/* Header của Menu */}
            <div className="p-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-b border-dashed border-gray-200 dark:border-zinc-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm shrink-0">
                  {user.profile.avatar_url ? (
                    <Image
                      src={user.profile.avatar_url}
                      alt={user.profile.fullname}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {getInitials(user.profile.fullname)}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                    {user.profile.fullname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-white/60 dark:bg-black/20 rounded-lg border border-gray-100 dark:border-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-md">
                    <Sparkles size={14} fill="currentColor" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Points
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {user.profile.total_points} PTS
                </span>
              </div>
            </div>

            {/* Nhóm chức năng chính */}
            <div className="p-2 space-y-0.5">
              <MenuItem
                href="/settings/profile"
                icon={<User size={18} />}
                label="Hồ sơ cá nhân"
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                href="/wallet"
                icon={<CreditCard size={18} />}
                label="Ví Time-Credits"
                badge={`${user.profile.total_points}`}
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                href="/my-courses"
                icon={<BookOpen size={18} />}
                label="Khóa học của tôi"
                onClick={() => setIsOpen(false)}
              />
            </div>

            <div className="h-px bg-gray-100 dark:bg-zinc-800 mx-2 my-1"></div>

            {/* Nhóm cài đặt & Logout */}
            <div className="p-2 pt-0 space-y-0.5">
              <MenuItem
                href="/settings"
                icon={<Settings size={18} />}
                label="Cài đặt"
                onClick={() => setIsOpen(false)}
              />
              <button
                onClick={() => {
                  console.log("Logout logic here");
                  // Gọi hàm logout của bạn ở đây
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200 group"
              >
                <div className="p-1.5 bg-red-100/50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <LogOut size={16} />
                </div>
                <span>Đăng xuất</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Component con cho từng dòng menu để code gọn hơn
function MenuItem({ href, icon, label, badge, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 shadow-sm group-hover:shadow-blue-200 dark:group-hover:shadow-none">
          {icon}
        </div>
        <span className="group-hover:translate-x-0.5 transition-transform duration-200">
          {label}
        </span>
      </div>
      {badge && (
        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/50">
          {badge}
        </span>
      )}
    </Link>
  );
}

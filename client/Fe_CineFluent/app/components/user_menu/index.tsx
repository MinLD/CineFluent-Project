"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Crown, LogOut, TreeDeciduousIcon, User } from "lucide-react";

import { FeApiProxyUrl } from "@/app/lib/services/api_client";
import { Ty_User } from "@/app/lib/types/users";

export default function UserMenu({ user }: { user: Ty_User }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative z-10" ref={menuRef}>
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="group flex items-center gap-3 rounded-full py-1 pl-2 pr-1 outline-none transition-all duration-300 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:hover:bg-zinc-800"
      >
        <div className="hidden text-right lg:block">
          <p className="max-w-[150px] truncate text-sm font-semibold leading-tight text-gray-700 transition-colors group-hover:text-blue-600 dark:text-gray-200 dark:group-hover:text-blue-400">
            {user.profile.fullname}
          </p>
          <div className="flex items-center justify-end gap-1">
            <span className="rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-300">
              {user.profile.total_points} PTS
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200 transition-all duration-300 group-hover:shadow-md dark:border-zinc-900 dark:ring-gray-700">
            {user.profile.avatar_url ? (
              <Image
                src={user.profile.avatar_url}
                alt={user.profile.fullname}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-blue-600 text-sm font-bold text-white">
                {getInitials(user.profile.fullname)}
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5 dark:bg-zinc-900">
            <div className="h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-zinc-900" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 z-80 mt-3 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="border-b border-dashed border-gray-200 bg-blue-50 p-4 dark:border-zinc-800/50 dark:bg-blue-900/10">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm dark:border-zinc-800">
                  {user.profile.avatar_url ? (
                    <Image
                      src={user.profile.avatar_url}
                      alt={user.profile.fullname}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-600 font-bold text-white">
                      {getInitials(user.profile.fullname)}
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-base font-bold text-gray-900 dark:text-white">
                    {user.profile.fullname}
                  </p>
                  <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-0.5 p-2">
              <MenuItem
                href="/settings/profile"
                icon={<Crown size={18} />}
                label="Gói VIP"
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                href="/settings/profile"
                icon={<User size={18} />}
                label="Hồ sơ cá nhân"
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                href="/studies/roadmap"
                icon={<TreeDeciduousIcon size={18} />}
                label="Tiến trình học tập"
                onClick={() => setIsOpen(false)}
              />
              <MenuItem
                href="/flashcards"
                icon={<BookOpen size={18} />}
                label="Học Flashcards"
                onClick={() => setIsOpen(false)}
              />
            </div>

            <div className="mx-2 my-1 h-px bg-gray-100 dark:bg-zinc-800" />

            <div className="space-y-0.5 p-2 pt-0">
              <button
                onClick={async () => {
                  try {
                    await axios.post(`${FeApiProxyUrl}/auth/logout`);
                    window.location.href = "/";
                  } catch (error) {
                    console.error("Logout failed", error);
                    window.location.href = "/";
                  }
                }}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
              >
                <div className="rounded-lg bg-red-100/50 p-1.5 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white dark:bg-red-900/20 dark:text-red-400">
                  <LogOut size={16} />
                </div>
                <span>Đăng xuất</span>
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  href,
  icon,
  label,
  badge,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-zinc-800"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-1.5 text-gray-500 shadow-sm transition-colors duration-200 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-blue-200 dark:bg-zinc-800 dark:text-gray-400 dark:group-hover:shadow-none">
          {icon}
        </div>
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          {label}
        </span>
      </div>
      {badge ? (
        <span className="rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800/50 dark:bg-blue-900/40 dark:text-blue-300">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

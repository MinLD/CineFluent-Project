"use client";

import React, { useState } from "react";
import {
  Home,
  Search,
  BookOpen,
  Wallet,
  Calendar,
  Settings,
  LogOut,
  HelpCircle,
  User,
  X,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Logo from "@/app/components/logo";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { mainNavLinks } from "@/app/lib/constants/navigation";

export default function SidebarWithAuth({ onClose }: { onClose: () => void }) {
  const { profile_user, isLoading } = useAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  return (
    <div className="flex h-full bg-white flex-col  text-gray-700 shadow-2xl ">
      <div>
        <div
          className=" px-2 pt-3 relative "
          onClick={() => {
            router.push("/");
            onClose();
          }}
        >
          <Logo />
        </div>

        <div onClick={onClose}>
          {" "}
          <X
            size={32}
            className="absolute top-2 right-5 hover:cursor-pointer"
            onClick={onClose}
          />
        </div>
      </div>
      <div className="w-full h-[1px] bg-[#f1f1f1] mt-5" />
      {/* --- 2. AUTH SECTION (QUAN TRỌNG NHẤT) --- */}
      <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/50">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ) : !profile_user ? (
          <div className="space-y-3">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-gray-800">
                Chào bạn mới! 👋
              </h3>
              <p className="text-xs text-gray-500">
                Đăng nhập để trao đổi kỹ năng và tích lũy Time-Credit ngay.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/login">
                <button className="cursor-pointer px-3 py-1 font-medium text-gray-600 transition-all hover:text-blue-800 dark:text-gray-300 dark:hover:text-blue-400">
                  Đăng nhập
                </button>
              </Link>
              <Link href="/auth/register">
                <button className="cursor-pointer rounded-sm bg-blue-600 px-3 py-1 text-white transition-all hover:bg-blue-800">
                  Đăng ký
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl  ">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-bold text-white shadow-blue-200">
              N
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="truncate font-bold text-gray-900">
                {profile_user?.profile?.fullname}
              </h4>
              <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-green-600">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{profile_user?.wallet_balance}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- 3. MENU ITEMS (Tự động co giãn với flex-1) --- */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Nhóm KHÁM PHÁ (Ai cũng thấy) */}
        <div>
          <h5 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Khám phá
          </h5>
          <div className="space-y-1">
            {mainNavLinks.map((link) => (
              <MenuItem
                key={link.id}
                icon={link.icons}
                label={link.label}
                href={link.href}
              />
            ))}
          </div>
        </div>

        {/* Nhóm CÁ NHÂN (Chỉ hiện khi ĐÃ Login) */}
        {isLoggedIn && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <h5 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
              Cá nhân
            </h5>
            <div className="space-y-1">
              <MenuItem
                icon={Wallet}
                label="Ví Time-Credit"
                href="/wallet"
                badge="120 Cr"
              />
              <MenuItem icon={Calendar} label="Lịch của tôi" href="/schedule" />
              <MenuItem icon={User} label="Hồ sơ cá nhân" href="/profile" />
            </div>
          </div>
        )}

        {/* Nhóm TIỆN ÍCH KHÁC */}
        <div>
          <h5 className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-gray-400">
            Khác
          </h5>
          <div className="space-y-1">
            <MenuItem icon={Settings} label="Cài đặt" href="/settings" />
            <MenuItem
              icon={HelpCircle}
              label="Trợ giúp & Hỗ trợ"
              href="/help"
            />
          </div>
        </div>
      </div>

      {/* --- 4. FOOTER (Đăng xuất hoặc Chuyển trạng thái Demo) --- */}
      <div className="border-t border-gray-100 p-3 bg-gray-50">
        {profile_user && (
          <button
            onClick={() => setIsLoggedIn(false)} // Demo chức năng đăng xuất
            className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5" />
              <span>Đăng xuất</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-50" />
          </button>
        )}
      </div>
    </div>
  );
}

// Component con để render từng dòng menu cho gọn
function MenuItem({ icon: Icon, label, href, badge, active }: any) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all ${
        active
          ? "bg-blue-50 text-blue-700 font-semibold"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-5 w-5 ${
            active ? "text-blue-600" : "text-gray-400 group-hover:text-blue-500"
          }`}
        />
        <span>{label}</span>
      </div>
      {badge && (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600">
          {badge}
        </span>
      )}
    </Link>
  );
}

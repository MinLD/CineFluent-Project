"use client";

import Image from "next/image";
import { Camera, Star } from "lucide-react";
import { useRef, useState } from "react";
import { Ty_User } from "@/app/lib/types/users";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { updateUserProfileAction } from "@/app/lib/actions/users";
import { toast } from "sonner";

export default function ProfileSidebar() {
  const { updateAuth, token, profile_user } = useAuth();

  const displayUser: Ty_User | null = profile_user || null;

  const [isOnline, setIsOnline] = useState(displayUser?.profile.is_online);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional: Validate file type/size
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPreviewUrl(previewUrl);

    setIsUploading(true);
    try {
      const formData = new FormData();
      if (token) formData.append("token", token);
      formData.append("avatar", file);

      const res = await updateUserProfileAction(formData);

      if (res.success) {
        toast.success("Cập nhật ảnh đại diện thành công!");
        if (updateAuth && res.data) {
          console.log(res.data);
          const updatedProfile = { ...displayUser, ...res.data };
          // @ts-ignore
          updateAuth({
            profile_user: updatedProfile,
          });
        }
      } else {
        toast.error(res.error || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("Upload error", error);
      toast.error("Có lỗi xảy ra khi tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };

  // Function to get badge color based on English level
  const getEnglishLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Advanced":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Card Danh Thiếp Chính */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        {/* Avatar */}
        <div className="relative inline-block mb-4">
          <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden mx-auto group">
            {displayUser?.profile.avatar_url ? (
              <Image
                src={previewUrl ? previewUrl : displayUser?.profile.avatar_url}
                alt={displayUser?.profile.fullname || "User Avatar"}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  isUploading ? "opacity-50" : ""
                }`}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-lg font-bold">
                  {displayUser?.profile.fullname?.charAt(0) || "U"}
                </span>
              </div>
            )}

            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <button
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="absolute bottom-1 right-1 bg-gray-900 text-white p-2 rounded-full hover:bg-blue-600 transition-colors shadow-sm z-20 cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <Camera size={14} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Tên & Bio */}
        <h2 className="text-2xl font-bold text-gray-900">
          {displayUser?.profile.fullname}
        </h2>
        <p className="overflow-hidden text-gray-500 text-sm mt-2 leading-relaxed px-2 whitespace-pre-line">
          {displayUser?.profile.bio}
        </p>

        {/* English Level Badge */}
        <div className="mt-4">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${getEnglishLevelColor(displayUser?.profile.english_level || "Beginner")}`}
          >
            <Star size={14} className="fill-current" />
            {displayUser?.profile.english_level || "Beginner"}
          </span>
        </div>

        <div className="border-t border-gray-100 my-6"></div>

        {/* Gamification Stats */}
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                <Star size={14} fill="currentColor" />
              </div>
              <span className="text-xs font-semibold text-gray-600">
                Total Points
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {displayUser?.profile.total_points || 0}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-orange-500 text-white rounded-lg">
                🔥
              </div>
              <span className="text-xs font-semibold text-gray-600">
                Streak Days
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {displayUser?.profile.streak_days || 0}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 my-6"></div>

        {/* Trạng thái Online (Toggle Switch) */}
        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
          <div className="text-left">
            <p className="text-sm font-bold text-gray-800">Ghép nhanh (SOS)</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}
              ></span>
              <span className="text-xs text-gray-500">
                {isOnline ? "Đang Online" : "Đang Bận"}
              </span>
            </div>
          </div>

          {/* Custom Toggle Switch */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              isOnline ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isOnline ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

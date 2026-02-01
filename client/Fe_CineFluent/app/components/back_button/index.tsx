"use client"; // Khai báo đây là Client Component để dùng được hook

import { useRouter } from "next/navigation";

export default function BackButton({
  nameCategory,
}: {
  nameCategory?: string;
}) {
  const router = useRouter();

  return (
    <p className="text-sm font-bold text-gray-500 mb-1 transition-colors">
      <span
        className="text-[#272727] cursor-pointer hover:text-gray-600 "
        onClick={() => router.back()}
      >
        Quay lại 
      </span>
      / {nameCategory}
    </p>
  );
}

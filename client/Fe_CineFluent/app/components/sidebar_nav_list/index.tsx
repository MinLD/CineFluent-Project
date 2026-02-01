"use client";

import { useSearchParams } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  data: {
    title: string;
    label: {
      id: string;
      name: string;
      icon: any;
    }[];
  }[];
};

export default function SidebarNavList({ data }: Props) {
  const searchParams = useSearchParams();
  const serverTab = searchParams.get("tab") || "Dashboard";

  const [optimisticTab, setOptimisticTab] = useState(serverTab);

  useEffect(() => {
    setOptimisticTab(serverTab);
  }, [serverTab]);

  return (
    <>
      <Link
        href="/admin?tab=Dashboard"
        scroll={false} // ✅ Giữ vị trí cuộn, không nhảy lên đầu trang
        className={`flex gap-2 items-center p-3 rounded px-2 hover:cursor-pointer hover:bg-[#2a303d] transition-colors ${
          optimisticTab === "Dashboard" ? "bg-[#2a303d] text-blue-400" : ""
        }`}
        onClick={() => setOptimisticTab("Dashboard")}
      >
        <LayoutDashboard size={20} /> <p>Thống kê</p>
      </Link>

      <div className="flex flex-col gap-2 p-2 mt-4">
        {data.map((i) => (
          <div key={i.title}>
            <div className="text-xs font-medium uppercase text-gray-400 mb-2">
              {i.title}
            </div>

            {i.label.map((j) => {
              const isActive = optimisticTab === j.id;

              return (
                <Link
                  key={j.id}
                  href={`/admin?tab=${j.id}`}
                  scroll={false} // ✅ Quan trọng để trải nghiệm mượt
                  className={`gap-2 flex items-center w-full border-gray-600 hover:bg-[#2a303d] rounded hover:cursor-pointer p-2 transition-colors ${
                    isActive ? "bg-[#2a303d] text-blue-400" : ""
                  }`}
                  // ✅ Instant Feedback (Phản hồi tức thì)
                  onClick={() => setOptimisticTab(j.id)}
                >
                  <j.icon size={20} />
                  <span>{j.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

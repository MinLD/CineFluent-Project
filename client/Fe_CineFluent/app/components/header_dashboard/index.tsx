"use client";

import { useNav } from "@/app/lib/hooks/useNav";
import {
  Bell,
  CircleUserRound,
  Languages,
  Logs,
  Mail,
  Menu,
  SunMoon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react"; // ✅ Import Suspense

// 1️⃣ TẠO COMPONENT CON: Chuyên xử lý việc đọc URL
// Component này sẽ "chậm" hơn phần còn lại 1 chút xíu, nhưng không chặn UI chính
function DashboardBreadcrumb() {
  const searchParams = useSearchParams();
  const isTypeGeneralDashboard = searchParams.get("tab") || "Dashboard";

  return (
    <span>
      {isTypeGeneralDashboard === "Dashboard"
        ? "Thống kê"
        : isTypeGeneralDashboard}
    </span>
  );
}
type Props = {
  isOpenSibar: () => void;
};
function HeaderDashBoard({ isOpenSibar }: Props) {
  const data = [
    {
      id: 1,
      name: "Dashboard",
    },
  ];
  const icons = [
    {
      id: 0,
      name: Bell,
    },
    {
      id: 1,
      name: Logs,
    },
    {
      id: 2,
      name: Mail,
    },
    {
      id: 3,
      name: Languages,
    },
    {
      id: 4,
      name: SunMoon,
    },
    {
      id: 5,
      name: CircleUserRound,
    },
  ];

  return (
    <>
      <div className="w-full h-[80px] bg-[#ffffff] py-6 px-[1vw] border-b-1 border-[#d9d9d9]">
        <div className="flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <div
              className=" hover:cursor-pointer"
              onClick={() => isOpenSibar()}
            >
              <Menu size={25} strokeWidth={1.25} />
            </div>

            {data.map((item) => (
              <div key={item.id} className="text-[16px]">
                {item.name}
              </div>
            ))}
          </div>
          <div className="flex gap-3 items-center">
            {icons.map((i) => (
              <div
                key={i.id}
                className={`${
                  i.id === 0 || i.id === 1 || (i.id === 2 && "hidden")
                } hover:cursor-pointer flex gap-2 items-center`}
              >
                <i.name size={25} strokeWidth={1.25} />

                {i.id !== 5 && <div className="w-px h-6 bg-[#d9d9d9] " />}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-[25px] bg-[#ffffff] py-5 px-[3vw] border-b-1 border-[#d9d9d9] flex items-center">
        <p className="text-[15px] flex gap-1">
          Dashboard /
          <Suspense fallback={<span>...</span>}>
            <DashboardBreadcrumb />
          </Suspense>
        </p>
      </div>
    </>
  );
}

export default HeaderDashBoard;

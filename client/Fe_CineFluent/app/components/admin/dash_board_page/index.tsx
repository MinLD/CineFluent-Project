"use client";
import RevenueChart from "@/app/components/revenue_chart";
import StatCard from "@/app/components/stat_card";
import { I_User_Stats } from "@/app/lib/types/users";
import { Users, Activity } from "lucide-react";

type props = {
  userStats: I_User_Stats;
};
export default function DashboardPage({ userStats }: props) {
  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>

      {/* Phần 1: Các thẻ số liệu (Grid 4 cột) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng người dùng"
          value={userStats?.summary?.total || 0}
          icon={Users}
          description="+12% so với tháng trước"
        />
        <StatCard
          title="Đang hoạt động"
          value={userStats?.summary?.active || 0}
          icon={Activity}
          description="Người dùng online trong 30p qua"
        />
      </div>

      {/* Phần 2: Biểu đồ (Grid 2 cột lệch: 1 cái to, 1 cái nhỏ nếu cần) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ chính chiếm 2 phần */}
        <div className="lg:col-span-2">
          <RevenueChart data={userStats?.chart_data} />
        </div>

        {/* Một thành phần khác bên cạnh (ví dụ: User mới nhất) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">Hoạt động gần đây</h3>
          <ul className="space-y-4">
            <li className="flex items-center justify-between">
              <span className="text-sm">Nguyễn Văn A vừa đăng ký</span>
              <span className="text-xs text-gray-400">2p trước</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-sm">Trần Thị B vừa mua hàng</span>
              <span className="text-xs text-gray-400">5p trước</span>
            </li>
            {/* ... */}
          </ul>
        </div>
      </div>
    </div>
  );
}

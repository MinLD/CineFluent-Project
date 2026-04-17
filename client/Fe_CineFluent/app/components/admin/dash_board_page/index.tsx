"use client";

import StatCard from "@/app/components/stat_card";
import { getAdminDashboardAction } from "@/app/lib/actions/admin_dashboard";
import {
  IAdminDashboardOverview,
  IDashboardActivity,
  IDashboardAlert,
  IDashboardTopVideo,
} from "@/app/lib/types/admin_dashboard";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Activity,
  Film,
  Globe,
  MessageCircleWarning,
  TriangleAlert,
  Sparkles,
  Wand2,
  Upload,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

type Props = {
  initialData: IAdminDashboardOverview;
};

type GrowthRow = {
  date: string;
  new_users: number;
  active_users: number;
};

type KpiCard = {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  trendLabel: string;
};

export default function DashboardPage({ initialData }: Props) {
  const [days, setDays] = useState(7);

  const { data, isFetching } = useQuery({
    queryKey: ["admin-dashboard", days],
    queryFn: () => getAdminDashboardAction(days, 5),
    initialData,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const growthData = useMemo<GrowthRow[]>(() => {
    const growth = data.charts.user_growth;
    return growth.dates.map((date: string, idx: number) => ({
      date,
      new_users: growth.new_users[idx] ?? 0,
      active_users: growth.active_users[idx] ?? 0,
    }));
  }, [data]);

  const previousHalfVsCurrentHalf = useMemo(() => {
    if (growthData.length < 4) return 0;
    const mid = Math.floor(growthData.length / 2);
    const prev = growthData
      .slice(0, mid)
      .reduce((acc, item) => acc + item.active_users, 0);
    const curr = growthData
      .slice(mid)
      .reduce((acc, item) => acc + item.active_users, 0);
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }, [growthData]);

  const aiCoverage = useMemo(() => {
    const total = data.summary.total_videos || 0;
    if (!total) return 0;
    const withAI = data.charts.content_status.videos_with_ai || 0;
    return Math.round((withAI / total) * 100);
  }, [data]);

  const subtitleCoverage = useMemo(() => {
    const total = data.summary.total_videos || 0;
    if (!total) return 0;
    const withSub = data.charts.content_status.videos_with_subtitle || 0;
    return Math.round((withSub / total) * 100);
  }, [data]);

  const kpiCards: KpiCard[] = [
    {
      title: "Tổng người dùng",
      value: data.summary.total_users,
      icon: Users,
      accent: "from-blue-500 to-indigo-500",
      trendLabel: `${previousHalfVsCurrentHalf >= 0 ? "+" : ""}${previousHalfVsCurrentHalf}%`,
    },
    {
      title: "Người dùng hoạt động",
      value: data.summary.active_users,
      icon: Activity,
      accent: "from-emerald-500 to-teal-500",
      trendLabel: "Theo lịch sử xem",
    },
    {
      title: "Tổng phim",
      value: data.summary.total_videos,
      icon: Film,
      accent: "from-fuchsia-500 to-pink-500",
      trendLabel: `${aiCoverage}% độ phủ AI`,
    },
    {
      title: "Phim công khai",
      value: data.summary.public_videos,
      icon: Globe,
      accent: "from-sky-500 to-cyan-500",
      trendLabel: `${subtitleCoverage}% độ phủ phụ đề`,
    },
    {
      title: "Yêu cầu chờ xử lý",
      value: data.summary.pending_requests,
      icon: MessageCircleWarning,
      accent: "from-amber-500 to-orange-500",
      trendLabel: "Hàng đợi yêu cầu",
    },
    {
      title: "Báo lỗi chờ xử lý",
      value: data.summary.pending_reports,
      icon: TriangleAlert,
      accent: "from-rose-500 to-red-500",
      trendLabel: "Hàng đợi sự cố",
    },
  ];

  const formatDateLabel = (iso: string) => {
    const d = new Date(iso);
    const mm = `${d.getMonth() + 1}`.padStart(2, "0");
    const dd = `${d.getDate()}`.padStart(2, "0");
    return `${mm}-${dd}`;
  };

  return (
    <div className="p-6 space-y-6 bg-slate-100 min-h-screen">
      <div className="rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider px-2 py-1 rounded-full bg-white/10 border border-white/20 mb-3">
              Trung tâm điều hành
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Tổng quan hệ thống CineFluent
            </h1>
            <p className="text-slate-300 mt-2 text-sm md:text-base">
              Quan sát tăng trưởng người dùng, sức khỏe nội dung và cảnh báo vận
              hành theo thời gian thực.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-300">Khoảng thời gian</div>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-white/20 rounded-lg px-3 py-2 text-sm bg-white/10 text-white"
            >
              <option className="text-slate-900" value={1}>
                Hôm nay
              </option>
              <option className="text-slate-900" value={7}>
                7D
              </option>
              <option className="text-slate-900" value={30}>
                30D
              </option>
              <option className="text-slate-900" value={90}>
                90D
              </option>
            </select>
            
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">
                  {card.title}
                </p>
                <div
                  className={`p-2.5 rounded-lg bg-gradient-to-br ${card.accent}`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-bold text-slate-900">
                {card.value}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {card.trendLabel}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Tăng trưởng người dùng (Cột)
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip labelFormatter={(label) => `Ngày ${label}`} />
                <Legend />
                <Bar
                  dataKey="new_users"
                  name="Người dùng mới"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="active_users"
                  name="Người dùng hoạt động"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Cảnh báo vận hành
          </h3>
          <div className="space-y-3">
            {data.alerts.map((a: IDashboardAlert) => (
              <div
                key={a.key}
                className={`flex items-center justify-between text-sm border rounded-lg p-3 ${
                  a.level === "critical"
                    ? "border-red-200 bg-red-50"
                    : a.level === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                }`}
              >
                <span className="font-medium text-slate-700">{a.title}</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    a.level === "critical"
                      ? "bg-red-100 text-red-700"
                      : a.level === "warning"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {a.value}
                </span>
              </div>
            ))}
            {data.alerts.length === 0 && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                Hệ thống ổn định. Không có cảnh báo nghiêm trọng.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Xu hướng tăng trưởng (Đường)
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip labelFormatter={(label) => `Ngày ${label}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="new_users"
                  name="Người dùng mới"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="active_users"
                  name="Người dùng hoạt động"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Thao tác nhanh
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Thêm phim và tải phụ đề
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-fuchsia-600" />
              Chạy phân tích độ khó AI
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Xử lý yêu cầu và báo lỗi chờ
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Top phim nổi bật</h3>
          <div className="space-y-3">
            {data.top_videos.map((v: IDashboardTopVideo) => (
              <div
                key={v.id}
                className="flex items-center justify-between text-sm border-b border-slate-100 pb-3"
              >
                <div>
                  <p className="font-medium text-slate-800">{v.title}</p>
                  <p className="text-xs text-slate-500">
                    Phụ đề: {v.subtitle_count} | CEFR: {v.cefr || "N/A"} |{" "}
                    {v.status}
                  </p>
                </div>
                <span className="text-blue-700 font-semibold">
                  {v.view_count}
                </span>
              </div>
            ))}
            {data.top_videos.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">
            Hoạt động gần đây
          </h3>
          <div className="space-y-3">
            {data.recent_activities.map(
              (a: IDashboardActivity, idx: number) => (
                <div
                  key={`${a.type}-${idx}`}
                  className="text-sm border-b border-slate-100 pb-3"
                >
                  <p className="text-slate-800 font-medium">{a.label}</p>
                  <p className="text-xs text-slate-500">{a.created_at}</p>
                </div>
              ),
            )}
            {data.recent_activities.length === 0 && (
              <p className="text-sm text-slate-500">Chưa có hoạt động</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Độ phủ AI (%)"
          value={`${aiCoverage}%`}
          icon={Sparkles}
          description="Tỷ lệ phim đã được phân tích độ khó bằng AI."
        />
        <StatCard
          title="Độ phủ phụ đề (%)"
          value={`${subtitleCoverage}%`}
          icon={Upload}
          description="Tỷ lệ phim đã có phụ đề trong kho phim."
        />
      </div>
    </div>
  );
}

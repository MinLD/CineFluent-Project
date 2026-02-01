"use client";

import { I_User_Stats_ChartData } from "@/app/lib/types/users";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: any;
}

export default function RevenueChart({ data }: Props) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[400px]">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Biểu đồ tăng trưởng
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data || []}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorUsers)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

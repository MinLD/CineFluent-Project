export interface I_DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  chartData: {
    name: string; // Ví dụ: "Tháng 1", "Tháng 2"
    users: number; // Số user mới
    revenue: number; // Doanh thu
  }[];
}

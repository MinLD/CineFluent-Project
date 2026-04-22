export interface IDashboardSummary {
  total_users: number;
  active_users: number;
  total_videos: number;
  public_videos: number;
  pending_requests: number;
  pending_reports: number;
}

export interface IDashboardUserGrowth {
  dates: string[];
  new_users: number[];
  active_users: number[];
}

export interface IDashboardContentStatus {
  videos_with_ai: number;
  videos_without_ai: number;
  videos_with_subtitle: number;
  videos_without_subtitle: number;
}

export interface IDashboardTopVideo {
  id: number;
  title: string;
  slug: string;
  view_count: number;
  status: string;
  level: string;
  ai_status?: string | null;
  ai_label?: string | null;
  subtitle_count: number;
}

export interface IDashboardAlert {
  key: string;
  level: "critical" | "warning" | "info";
  title: string;
  value: number;
}

export interface IDashboardActivity {
  type: string;
  label: string;
  created_at: string;
}

export interface IAdminDashboardOverview {
  summary: IDashboardSummary;
  charts: {
    user_growth: IDashboardUserGrowth;
    content_status: IDashboardContentStatus;
  };
  top_videos: IDashboardTopVideo[];
  alerts: IDashboardAlert[];
  recent_activities: IDashboardActivity[];
}

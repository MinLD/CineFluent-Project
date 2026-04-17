import { cookies } from "next/headers";
import { BeUrl } from "@/app/lib/services/api_client";
import { IAdminDashboardOverview } from "@/app/lib/types/admin_dashboard";

function emptyDashboard(): IAdminDashboardOverview {
  return {
    summary: {
      total_users: 0,
      active_users: 0,
      total_videos: 0,
      public_videos: 0,
      pending_requests: 0,
      pending_reports: 0,
    },
    charts: {
      user_growth: { dates: [], new_users: [], active_users: [] },
      content_status: {
        videos_with_ai: 0,
        videos_without_ai: 0,
        videos_with_subtitle: 0,
        videos_without_subtitle: 0,
      },
    },
    top_videos: [],
    alerts: [],
    recent_activities: [],
  };
}

export async function SSR_Admin_Dashboard(days = 7, top = 5) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const response = await fetch(
      `${BeUrl}/admin-dashboard/overview?days=${days}&top=${top}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return emptyDashboard();
    }

    const data = await response.json();
    return data?.data ?? emptyDashboard();
  } catch (error) {
    return emptyDashboard();
  }
}

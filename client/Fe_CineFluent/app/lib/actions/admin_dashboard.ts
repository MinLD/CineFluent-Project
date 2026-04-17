"use server";

import { cookies } from "next/headers";
import { Api_Admin_Dashboard_Overview } from "@/app/lib/services/admin_dashboard";
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

export async function getAdminDashboardAction(days = 7, top = 5) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const res = await Api_Admin_Dashboard_Overview(token, days, top);

    return res?.data?.data ?? emptyDashboard();
  } catch (error) {
    return emptyDashboard();
  }
}

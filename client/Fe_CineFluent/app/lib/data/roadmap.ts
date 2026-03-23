import { cookies } from "next/headers";

import { BeUrl } from "@/app/lib/services/api_client";
import {
  RoadmapDashboardData,
  RoadmapLessonPageData,
} from "@/app/lib/types/roadmap";

export async function SSR_RoadmapDashboardData(): Promise<{
  data: RoadmapDashboardData | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [assessmentsResponse, roadmapsResponse] = await Promise.all([
      fetch(`${BeUrl}/roadmap/assessment/history`, {
        headers,
        next: { revalidate: 0, tags: ["roadmap-assessments"] },
      }),
      fetch(`${BeUrl}/roadmap/`, {
        headers,
        next: { revalidate: 0, tags: ["roadmaps"] },
      }),
    ]);

    if (!assessmentsResponse.ok || !roadmapsResponse.ok) {
      throw new Error("Không thể tải dữ liệu roadmap.");
    }

    const assessmentsJson = await assessmentsResponse.json();
    const roadmapsJson = await roadmapsResponse.json();

    return {
      data: {
        assessments: assessmentsJson.data || [],
        roadmaps: roadmapsJson.data || [],
      },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || "Error fetching roadmap dashboard data",
    };
  }
}

export async function SSR_RoadmapLessonData(
  roadmapId: number,
  dayNumber: number,
): Promise<{
  data: RoadmapLessonPageData | null;
  error: string | null;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const [roadmapResponse, taskResponse] = await Promise.all([
      fetch(`${BeUrl}/roadmap/${roadmapId}`, {
        headers,
        next: { revalidate: 0, tags: [`roadmap-${roadmapId}`] },
      }),
      fetch(`${BeUrl}/roadmap/${roadmapId}/task/${dayNumber}`, {
        headers,
        next: { revalidate: 0, tags: [`roadmap-task-${roadmapId}-${dayNumber}`] },
      }),
    ]);

    if (!roadmapResponse.ok || !taskResponse.ok) {
      throw new Error("Không thể tải dữ liệu ngày học.");
    }

    const roadmapJson = await roadmapResponse.json();
    const taskJson = await taskResponse.json();
    const roadmap = roadmapJson.data;
    const dayPlan =
      roadmap?.blueprint?.days?.find((item: any) => item.day === dayNumber) || null;

    if (!roadmap || !dayPlan) {
      return { data: null, error: "404" };
    }

    return {
      data: {
        roadmap,
        dayPlan,
        task: taskJson.data || null,
      },
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || "Error fetching roadmap lesson data",
    };
  }
}

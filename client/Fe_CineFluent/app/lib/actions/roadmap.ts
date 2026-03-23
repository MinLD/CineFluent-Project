"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  Api_generate_assessment,
  Api_generate_daily_task,
  Api_generate_roadmap,
  Api_get_assessment_history,
  Api_get_daily_task,
  Api_get_roadmap_detail,
  Api_get_roadmaps,
  Api_reset_assessment,
  Api_submit_assessment,
} from "@/app/lib/services/roadmap";
import {
  AssessmentUserAnswers,
  RoadmapDayPlan,
} from "@/app/lib/types/roadmap";

async function getAccessToken() {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
}

export async function generateAssessmentAction() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_generate_assessment(token);
    revalidatePath("/studies/roadmap");
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể tạo bài test AI",
    };
  }
}

export async function getAssessmentHistoryAction() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_get_assessment_history(token);
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể lấy lịch sử đánh giá",
    };
  }
}

export async function submitAssessmentAction(
  assessmentId: number,
  userAnswers: AssessmentUserAnswers,
) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_submit_assessment(assessmentId, userAnswers, token);
    revalidatePath("/studies/roadmap");
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể chấm điểm bài đánh giá",
    };
  }
}

export async function resetAssessmentAction(assessmentId: number) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_reset_assessment(assessmentId, token);
    revalidatePath("/studies/roadmap");
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể reset bài đánh giá",
    };
  }
}

export async function generateRoadmapAction(payload: {
  current_score: number;
  target_score: number;
  duration_days: number;
}) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_generate_roadmap(payload, token);
    revalidatePath("/studies/roadmap");
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể tạo lộ trình AI",
    };
  }
}

export async function getRoadmapsAction() {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_get_roadmaps(token);
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể lấy danh sách lộ trình",
    };
  }
}

export async function getRoadmapDetailAction(roadmapId: number) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_get_roadmap_detail(roadmapId, token);
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể lấy chi tiết lộ trình",
    };
  }
}

export async function getDailyTaskAction(roadmapId: number, dayNumber: number) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_get_daily_task(roadmapId, dayNumber, token);
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể lấy bài học theo ngày",
    };
  }
}

export async function generateDailyTaskAction(
  roadmapId: number,
  dayNumber: number,
  dayPlan: RoadmapDayPlan,
) {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: "Unauthorized" };
    }

    const result = await Api_generate_daily_task(
      roadmapId,
      dayNumber,
      dayPlan,
      token,
    );
    revalidatePath("/studies/roadmap");
    revalidatePath(`/studies/roadmap/${roadmapId}/day/${dayNumber}`);
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Không thể tạo bài học theo ngày",
    };
  }
}

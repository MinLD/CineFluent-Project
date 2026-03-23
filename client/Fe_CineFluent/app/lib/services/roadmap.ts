import { axiosClient } from "@/app/lib/services/api_client";
import { AssessmentUserAnswers, RoadmapDayPlan } from "@/app/lib/types/roadmap";

const BASE_URL = "/roadmap";

export const Api_generate_assessment = async (token: string) => {
  return axiosClient.get(`${BASE_URL}/assessment/generate`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_get_assessment_history = async (token: string) => {
  return axiosClient.get(`${BASE_URL}/assessment/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_submit_assessment = async (
  assessmentId: number,
  userAnswers: AssessmentUserAnswers,
  token: string,
) => {
  return axiosClient.post(
    `${BASE_URL}/assessment/submit`,
    {
      assessment_id: assessmentId,
      user_answers: userAnswers,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const Api_reset_assessment = async (
  assessmentId: number,
  token: string,
) => {
  return axiosClient.post(
    `${BASE_URL}/assessment/${assessmentId}/reset`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const Api_generate_roadmap = async (
  payload: {
    current_score: number;
    target_score: number;
    duration_days: number;
  },
  token: string,
) => {
  return axiosClient.post(`${BASE_URL}/generate-blueprint`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const Api_get_roadmaps = async (token: string) => {
  return axiosClient.get(`${BASE_URL}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_get_roadmap_detail = async (
  roadmapId: number,
  token: string,
) => {
  return axiosClient.get(`${BASE_URL}/${roadmapId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_get_daily_task = async (
  roadmapId: number,
  dayNumber: number,
  token: string,
) => {
  return axiosClient.get(`${BASE_URL}/${roadmapId}/task/${dayNumber}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_generate_daily_task = async (
  roadmapId: number,
  dayNumber: number,
  dayPlan: RoadmapDayPlan,
  token: string,
) => {
  return axiosClient.post(
    `${BASE_URL}/${roadmapId}/task/${dayNumber}`,
    {
      day_plan: dayPlan,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

import { axiosClient } from "@/app/lib/services/api_client";

export const Api_create_flashcard = async (data: any, token: string) => {
  return axiosClient.post(`/flashcards`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const Api_generate_exercises = async (data: any, token: string) => {
  return axiosClient.post(`/learning/generate_exercises`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

export const Api_get_exercises_history = async (
  token: string,
  page = 1,
  per_page = 10,
) => {
  return axiosClient.get(
    `/learning/exercises?page=${page}&per_page=${per_page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const Api_submit_exercise = async (
  exerciseId: number,
  score: number,
  token: string,
  user_answers?: any,
) => {
  return axiosClient.post(
    `/learning/exercises/${exerciseId}/submit`,
    { score, user_answers },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

export const Api_reset_exercise = async (exerciseId: number, token: string) => {
  return axiosClient.post(
    `/learning/exercises/${exerciseId}/reset`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
};

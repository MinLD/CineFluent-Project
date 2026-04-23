import { BeUrl } from "@/app/lib/services/api_client";

export async function Api_Generate_GrammarReview(
  token: string | undefined,
  tagId: number,
  count = 5,
  refresh = false,
) {
  const response = await fetch(`${BeUrl}/learning-tree/tags/${tagId}/review/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ count, refresh }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`[${response.status}] Grammar review generate failed`);
  }

  return await response.json();
}

export async function Api_Submit_GrammarReview(
  token: string | undefined,
  exerciseId: number,
  userAnswers: Record<string, string>,
) {
  const response = await fetch(`${BeUrl}/learning-tree/reviews/${exerciseId}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ user_answers: userAnswers }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`[${response.status}] Grammar review submit failed`);
  }

  return await response.json();
}

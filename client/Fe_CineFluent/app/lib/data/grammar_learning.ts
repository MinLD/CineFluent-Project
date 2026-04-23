import { cookies } from "next/headers";

import { BeUrl } from "@/app/lib/services/api_client";
import {
  IGrammarReviewHistoryData,
  IGrammarLessonData,
  IGrammarReviewData,
} from "@/app/lib/types/grammar_learning";

type TGrammarFetchResult<T> = {
  data: T | null;
  error: string | null;
};

export async function SSR_GrammarLessonData(
  tagId: number,
): Promise<TGrammarFetchResult<IGrammarLessonData>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const response = await fetch(`${BeUrl}/learning-tree/tags/${tagId}/lesson`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0, tags: [`grammar-lesson-${tagId}`] },
    });

    if (!response.ok) {
      throw new Error("Không thể tải bài học ngữ pháp.");
    }

    const json = await response.json();
    return { data: json.data ?? null, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || "Không thể tải bài học ngữ pháp.",
    };
  }
}

export async function SSR_GrammarReviewData(
  tagId: number,
  exerciseId?: number | null,
): Promise<TGrammarFetchResult<IGrammarReviewData>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const reviewUrl =
      exerciseId && Number.isInteger(exerciseId)
        ? `${BeUrl}/learning-tree/reviews/${exerciseId}`
        : `${BeUrl}/learning-tree/tags/${tagId}/review?count=5`;

    const response = await fetch(reviewUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        revalidate: 0,
        tags: [
          `grammar-review-${tagId}`,
          ...(exerciseId ? [`grammar-review-exercise-${exerciseId}`] : []),
        ],
      },
    });

    if (!response.ok) {
      throw new Error("Không thể tải bài ôn tập ngữ pháp.");
    }

    const json = await response.json();
    return { data: json.data ?? null, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || "Không thể tải bài ôn tập ngữ pháp.",
    };
  }
}

export async function SSR_GrammarReviewHistoryData(
  tagId: number,
): Promise<TGrammarFetchResult<IGrammarReviewHistoryData>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { data: null, error: "401" };
    }

    const response = await fetch(`${BeUrl}/learning-tree/tags/${tagId}/reviews/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0, tags: [`grammar-review-history-${tagId}`] },
    });

    if (!response.ok) {
      throw new Error("Không thể tải lịch sử ôn tập.");
    }

    const json = await response.json();
    return { data: json.data ?? null, error: null };
  } catch (error: any) {
    return {
      data: null,
      error: error?.message || "Không thể tải lịch sử ôn tập.",
    };
  }
}

"use server";

import { cookies } from "next/headers";

import {
  Api_Generate_GrammarReview,
  Api_Submit_GrammarReview,
} from "@/app/lib/services/grammar_learning";

export async function generateGrammarReviewAction(tagId: number, refresh = false) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { success: false, status: 401, message: "Unauthorized" };
    }

    const data = await Api_Generate_GrammarReview(token, tagId, 5, refresh);
    return { success: true, data: data.data };
  } catch (error: any) {
    if (error.message.includes("401")) {
      return { success: false, status: 401, message: "Unauthorized" };
    }

    console.error("Grammar Review Generate Error:", error.message);
    return { success: false, status: 500, message: "Server Error" };
  }
}

export async function submitGrammarReviewAction(
  exerciseId: number,
  userAnswers: Record<string, string>,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { success: false, status: 401, message: "Unauthorized" };
    }

    const data = await Api_Submit_GrammarReview(token, exerciseId, userAnswers);
    return { success: true, data: data.data };
  } catch (error: any) {
    if (error.message.includes("401")) {
      return { success: false, status: 401, message: "Unauthorized" };
    }

    console.error("Grammar Review Submit Error:", error.message);
    return { success: false, status: 500, message: "Server Error" };
  }
}

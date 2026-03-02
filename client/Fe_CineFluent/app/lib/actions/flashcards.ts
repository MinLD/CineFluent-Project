"use server";

import {
  Api_create_flashcard,
  Api_generate_exercises,
  Api_get_exercises_history,
  Api_submit_exercise,
  Api_reset_exercise,
} from "@/app/lib/services/flashcards";
import { revalidatePath } from "next/cache";

export async function saveFlashcardAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;

    if (!token) {
      return {
        success: false,
        error: "Vui lòng đăng nhập để lưu từ vựng!",
      };
    }

    const payload = {
      video_id: Number(formData.get("video_id")),
      word: formData.get("word") as string,
      context_sentence: formData.get("context_sentence") as string,
      ipa: formData.get("ipa") as string,
      pos: formData.get("pos") as string,
      definition_vi: formData.get("definition_vi") as string,
      example_en: formData.get("example_en") as string,
      example_vi: formData.get("example_vi") as string,
    };

    const result = await Api_create_flashcard(payload, token);

    revalidatePath("/flashcards"); // Invalidate cache so page reflects newly saved flashcard

    return {
      success: true,
      message: "Đã lưu từ vựng!",
    };
  } catch (error: any) {
    console.error("[saveFlashcardAction] Error:", error.message);
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi lưu",
    };
  }
}

export async function generateQuizAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const flashcardsJson = formData.get("flashcards") as string;

    if (!token) {
      return {
        success: false,
        error: "Vui lòng đăng nhập để tạo bài tập!",
      };
    }

    let flashcards = [];
    try {
      flashcards = JSON.parse(flashcardsJson);
    } catch (e) {
      return { success: false, error: "Dữ liệu flashcards không hợp lệ" };
    }

    const payload = {
      flashcards: flashcards,
    };

    const result = await Api_generate_exercises(payload, token);

    revalidatePath("/flashcards"); // Revalidate to show in history

    return {
      success: true,
      data: result.data.data, // Assuming Flask returns code: 200, data: { ... }
    };
  } catch (error: any) {
    console.error("[generateQuizAction] Error:", error.message);
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi tạo bài tập",
    };
  }
}

export async function getExercisesHistoryAction(
  prevState: any,
  formData: FormData,
) {
  try {
    const token = formData.get("token") as string;
    const page = Number(formData.get("page")) || 1;
    const per_page = Number(formData.get("per_page")) || 10;

    if (!token) return { success: false, error: "Unauthorized" };

    const result = await Api_get_exercises_history(token, page, per_page);
    return { success: true, data: result.data.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi lấy lịch sử",
    };
  }
}

export async function submitExerciseAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const exerciseId = Number(formData.get("exerciseId"));
    const score = Number(formData.get("score"));
    const userAnswersJson = formData.get("userAnswers") as string;
    const userAnswers = userAnswersJson ? JSON.parse(userAnswersJson) : null;

    if (!token) return { success: false, error: "Unauthorized" };

    const result = await Api_submit_exercise(
      exerciseId,
      score,
      token,
      userAnswers,
    );
    revalidatePath("/flashcards");
    return { success: true, message: "Đã nộp bài thành công!" };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi nộp bài",
    };
  }
}

export async function resetExerciseAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const exerciseId = Number(formData.get("exerciseId"));

    if (!token) return { success: false, error: "Unauthorized" };

    const result = await Api_reset_exercise(exerciseId, token);
    revalidatePath("/flashcards");
    return { success: true, message: "Đã reset bài tập!" };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi reset",
    };
  }
}

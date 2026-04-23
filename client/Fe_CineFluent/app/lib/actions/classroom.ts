"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  Api_Create_Class_Session,
  Api_Create_Classroom,
  Api_Join_Classroom,
} from "@/app/lib/services/classroom";

export async function createClassroomAction(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { success: false, error: "Vui lòng đăng nhập để tạo lớp học." };
    }

    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!name) {
      return { success: false, error: "Tên lớp không được để trống." };
    }

    const response = await Api_Create_Classroom(token, {
      name,
      description,
    });

    revalidatePath("/studies/classrooms");
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể tạo lớp học.",
    };
  }
}

export async function joinClassroomAction(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { success: false, error: "Vui lòng đăng nhập để tham gia lớp học." };
    }

    const inviteCode = String(formData.get("invite_code") || "").trim().toUpperCase();
    if (!inviteCode) {
      return { success: false, error: "Vui lòng nhập mã lớp." };
    }

    const response = await Api_Join_Classroom(token, inviteCode);

    revalidatePath("/studies/classrooms");
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể tham gia lớp học.",
    };
  }
}

export async function createClassSessionAction(prevState: any, formData: FormData) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { success: false, error: "Vui lòng đăng nhập để tạo buổi học." };
    }

    const classroomId = Number(formData.get("classroom_id"));
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const scheduledAt = String(formData.get("scheduled_at") || "").trim();
    const teacherNotes = String(formData.get("teacher_notes") || "").trim();
    const grammarFocus = String(formData.get("grammar_focus") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!Number.isInteger(classroomId)) {
      return { success: false, error: "Lớp học không hợp lệ." };
    }
    if (!title) {
      return { success: false, error: "Tên buổi học không được để trống." };
    }

    const response = await Api_Create_Class_Session(token, classroomId, {
      title,
      description,
      scheduled_at: scheduledAt,
      grammar_focus: grammarFocus,
      teacher_notes: teacherNotes,
    });

    revalidatePath(`/studies/classrooms/${classroomId}`);
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể tạo buổi học.",
    };
  }
}

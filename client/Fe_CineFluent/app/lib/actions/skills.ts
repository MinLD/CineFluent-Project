"use server";
import { revalidatePath } from "next/cache";
import { BeUrl } from "@/app/lib/services/api_client";
import { Api_create_user_skill } from "@/app/lib/services/skills";

export async function CreateUserSkillAction(data: FormData, token: string) {
  try {
    if (!token) {
      return {
        success: false,
        error: "Token not found",
      };
    }
    const res = await Api_create_user_skill(data, token);
    revalidatePath("/");
    return {
      success: true,
      data: res.data,
      message: "Thêm kỹ năng thành công",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || "Lỗi khi thêm kỹ năng",
    };
  }
}

export async function UpdateUserSkillAction(
  data: FormData,
  token: string,
  id: string
) {
  try {
    if (!token) {
      return {
        success: false,
        error: "Token not found",
      };
    }

    const res = await fetch(`${BeUrl}/user_skills/${id}`, {
      method: "PATCH",
      body: data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to update user skill");
    }

    const result = await res.json();
    revalidatePath("/");
    return {
      success: true,
      data: result.data,
      message: "Cập nhật kỹ năng thành công",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi khi cập nhật kỹ năng",
    };
  }
}
export async function DeleteUserSkillAction(token: string, id: string) {
  try {
    if (!token) {
      return {
        success: false,
        error: "Token not found",
      };
    }

    const res = await fetch(`${BeUrl}/user_skills/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to delete user skill");
    }

    const result = await res.json();
    revalidatePath("/");
    return {
      success: true,
      data: result.data,
      message: "Xóa kỹ năng thành công",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Lỗi khi xóa kỹ năng",
    };
  }
}

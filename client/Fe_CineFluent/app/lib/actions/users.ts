"use server";

import { revalidatePath } from "next/cache";
import { Api_Admin_User, Api_Delete_User } from "@/app/lib/services/user";
import { I_FormUser } from "@/app/lib/types/users";

export async function createUserAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;

    if (!token) {
      return {
        success: false,
        error: "Không tìm thấy token xác thực",
      };
    }

    // Extract form data
    const userData: I_FormUser = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullname: formData.get("fullname") as string,
      role: formData.get("role") as string,
    };

    // ✅ API call on server side
    const result = await Api_Admin_User(token, userData);

    // ✅ Revalidate cache
    revalidatePath("/admin");

    return {
      success: true,
      data: result.data,
      message: "Tạo người dùng thành công",
    };
  } catch (error: any) {
    console.error("[createUserAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Tạo người dùng thất bại",
    };
  }
}

/**
 * ✅ Next 16 Server Action: Delete User (Admin)
 */
export async function deleteUserAction(userId: string, token: string) {
  try {
    if (!token || !userId) {
      return {
        success: false,
        error: "Thiếu thông tin cần thiết",
      };
    }

    await Api_Delete_User(userId, token);

    // ✅ Revalidate affected paths
    revalidatePath("/admin");

    return {
      success: true,
      message: "Xóa người dùng thành công",
    };
  } catch (error: any) {
    console.error("[deleteUserAction] Error:", error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Xóa thất bại",
    };
  }
}

/**
 * ✅ Next 16 Server Action: Update User (Admin)
 */
export async function updateUserAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const userId = formData.get("userId") as string;

    if (!token || !userId) {
      return {
        success: false,
        error: "Thiếu thông tin cần thiết",
      };
    }

    // ✅ API call on server side
    const response = await fetch(`http://127.0.0.1:5000/api/users/${userId}`, {
      method: "PATCH",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Cập nhật người dùng thất bại");
    }

    const result = await response.json();

    // ✅ Revalidate cache after mutation
    revalidatePath("/admin");

    return {
      success: true,
      data: result.data,
      message: "Cập nhật người dùng thành công",
    };
  } catch (error: any) {
    console.error("[updateUserAction] Error:", error.message);
    return {
      success: false,
      error: error.message || "Cập nhật người dùng thất bại",
    };
  }
}

export async function updateUserProfileAction(formData: FormData) {
  try {
    const token = formData.get("token") as string;

    // ✅ API call on server side
    const response = await fetch(`http://127.0.0.1:5000/api/users/profile`, {
      method: "PATCH",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Cập nhật người dùng thất bại");
    }

    const result = await response.json();

    // ✅ Revalidate cache after mutation
    revalidatePath("/");

    return {
      success: true,
      data: result.data,
      message: "Cập nhật người dùng thành công",
    };
  } catch (error: any) {
    console.error("[updateUserProfileAction] Error:", error.message);
    return {
      success: false,
      error: error.message || "Cập nhật người dùng thất bại",
    };
  }
}

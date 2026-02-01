"use server";

import { revalidatePath } from "next/cache";
import {
  Api_create_category,
  Api_update_category,
  Api_delete_category,
  Api_get_all_skills_in_category,
} from "@/app/lib/services/categories";
import {
  Api_create_skill,
  Api_delete_skill,
  Api_update_skill,
} from "@/app/lib/services/skills";

export async function createCategoryAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;

    if (!token) {
      return {
        success: false,
        error: "Không tìm thấy token xác thực",
      };
    }
    formData.delete("token");

    // ✅ API call on server side (credentials safe)
    const result = await Api_create_category(formData, token);

    // ✅ Revalidate cache after mutation
    revalidatePath("/admin");

    return {
      success: true,
      data: result.data.data,
      message: "Tạo danh mục thành công",
    };
  } catch (error: any) {
    console.error("[createCategoryAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Tạo danh mục thất bại",
    };
  }
}

export async function updateCategoryAction(prevState: any, formData: FormData) {
  try {
    const categoryId = formData.get("categoryId") as string;
    const token = formData.get("token") as string;

    if (!token || !categoryId) {
      return {
        success: false,
        error: "Thiếu thông tin cần thiết",
      };
    }

    const result = await Api_update_category(categoryId, formData, token);

    // ✅ Revalidate affected paths
    revalidatePath("/admin");

    return {
      success: true,
      data: result.data,
      message: "Cập nhật danh mục thành công",
    };
  } catch (error: any) {
    console.error("[updateCategoryAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || "Cập nhật thất bại",
    };
  }
}

export async function deleteCategoryAction(categoryId: string, token: string) {
  try {
    if (!token || !categoryId) {
      return {
        success: false,
        error: "Thiếu thông tin cần thiết",
      };
    }

    await Api_delete_category(categoryId, token);

    // ✅ Revalidate affected paths
    revalidatePath("/admin");

    return {
      success: true,
      message: "Xóa danh mục thành công",
    };
  } catch (error: any) {
    console.error("[deleteCategoryAction] Error:", error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Xóa thất bại",
    };
  }
}

export async function createSkillAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    if (!token) {
      return {
        success: false,
        error: "Không tìm thấy token xác thực",
      };
    }
    formData.delete("token");

    // ✅ API call on server side (credentials safe)
    const result = await Api_create_skill(formData, token);
    // ✅ Revalidate cache after mutation
    revalidatePath("/admin");
    return {
      success: true,
      data: result.data,
      message: "Tạo kỹ năng thành công",
    };
  } catch (error: any) {
    console.error("[createSkillAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Tạo kỹ năng thất bại",
    };
  }
}
export async function updateSkillAction(prevState: any, formData: FormData) {
  try {
    const skillId = formData.get("skillId") as string;
    const token = formData.get("token") as string;
    if (!token || !skillId) {
      return {
        success: false,
        error: "Thiếu thông tin cần thiết",
      };
    }
    formData.delete("token");
    formData.delete("skillId");
    const result = await Api_update_skill(skillId, formData, token);
    // ✅ Revalidate affected paths
    revalidatePath("/admin");
    return {
      success: true,
      data: result.data,
      message: "Cập nhật kỹ năng thành công",
    };
  } catch (error: any) {
    console.error("[updateSkillAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Cập nhật kỹ năng thất bại",
    };
  }
}

export async function deleteSkillAction(skillId: string, token: string) {
  try {
    if (!token || !skillId) {
      return {
        success: false,
        error: "Thiếu thông tin cần thiết",
      };
    }
    await Api_delete_skill(skillId, token);
    // ✅ Revalidate affected paths
    revalidatePath("/admin");
    return {
      success: true,
      message: "Xóa kỹ năng thành công",
    };
  } catch (error: any) {
    console.error("[deleteSkillAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Xóa kỹ năng thất bại",
    };
  }
}

export async function getSkillsByCategoryAction(categoryId: string) {
  try {
    // This action is for client-side usage, so we don't strictly need a token if it's public data,
    // but the API wrapper might expect one or we can use a client fetching strategy.
    // However, since we have the service `Api_get_all_skills_in_category`, let's try to use it.
    // Note: The service uses `axiosClient` which might handle base URL.
    // `Api_get_all_skills_in_category` signature: (categoryId, page, per_page)

    // We want ALL skills for the dropdown, so page 1, large per_page
    const result = await Api_get_all_skills_in_category(categoryId, 1, 100);

    return {
      success: true,
      data: result.data.data.skills, // Adjust based on actual API response structure
    };
  } catch (error: any) {
    console.error("[getSkillsByCategoryAction] Error:", error?.message);
    return {
      success: false,
      data: [],
      error: error?.message || "Failed to fetch skills",
    };
  }
}

export async function loadMoreCategoriesAction(
  page: number,
  per_page: number,
  search: string = "",
  sort: string = "",
) {
  try {
    const { SSR_Categories } = await import("@/app/lib/data/categories");
    const { categories, pagination } = await SSR_Categories(
      page,
      per_page,
      search,
      sort,
    );
    return {
      success: true,
      data: categories,
      pagination,
    };
  } catch (error: any) {
    console.error("[loadMoreCategoriesAction] Error:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function getAllCategoriesAction() {
  try {
    const { SSR_Categories } = await import("@/app/lib/data/categories");
    // Fetch a large number to ensure we get most categories for the dropdown
    const { categories } = await SSR_Categories(1, 100, "", "");
    return {
      success: true,
      data: categories,
    };
  } catch (error: any) {
    console.error("[getAllCategoriesAction] Error:", error.message);
    return {
      success: false,
      data: [],
      error: error.message,
    };
  }
}

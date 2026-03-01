import { BeUrl } from "@/app/lib/services/api_client";

// ✅ Next 16 Fix: Add return type for better type safety
export async function SSR_Categories(page = 1, per_page = 5) {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
    });
    const res = await fetch(`${BeUrl}/categories?${queryParams.toString()}`, {
      next: { tags: ["categories"] },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("[SSR_Categories] Fetched data:", data.data);
    const { categories, pagination } = data?.data;
    return { categories, pagination };
  } catch (error: any) {
    console.error("[SSR_Categories] Error:", error.message);
    return {
      categories: null,
      pagination: {
        current_page: 1,
        per_page: per_page,
        total_items: 0,
        total_pages: 0,
      },
    };
  }
}

export async function SSR_All_SkillsByCategories(
  categoryId: string,
  page = 1,
  per_page = 3,
) {
  try {
    const res = await fetch(
      `${BeUrl}/categories/${categoryId}/skills?page=${page}&per_page=${per_page}`,
      {
        next: { tags: ["skills", `category-${categoryId}-skills`] },
      },
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("[SSR_All_SkillsByCategories] Fetched data:", data.data);
    const { skills, pagination } = data?.data;
    return { skills, pagination };
  } catch (error: any) {
    console.error("[SSR_All_SkillsByCategories] Error:", error.message);
    return {
      skills: null,
      pagination: {
        current_page: 1,
        per_page: 0,
        total_items: 0,
        total_pages: 0,
      },
    };
  }
}

export async function SSR_All_VideosByCategories(
  categoryId: string,
  page = 1,
  per_page = 1000000,
) {
  try {
    const res = await fetch(
      `${BeUrl}/videos?category_id=${categoryId}&page=${page}&per_page=${per_page}`,
      {
        next: { tags: ["videos", `category-${categoryId}-videos`] },
      },
    );
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("[SSR_All_VideosByCategories] Fetched data:", data.data);
    const { videos, pagination } = data?.data;
    return { videos, pagination };
  } catch (error: any) {
    console.error("[SSR_All_VideosByCategories] Error:", error.message);
    return {
      videos: null,
      pagination: {
        current_page: 1,
        per_page: 0,
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }
}

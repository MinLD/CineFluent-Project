import { BeUrl } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";

export async function SSR_Users(page = 1, per_page = 5) {
  try {
    // ✅ Next 16 Fix: Explicit await on cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const response = await fetch(
      `${BeUrl}/users?page=${page}&per_page=${per_page}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      }
    );
    const res = await response.json();
    const { users, pagination } = res.data;
    return { users, pagination };
  } catch (error: any) {
    console.log("[SSR_Users] Failed to fetch users:", error?.message);
    return {
      users: null,
      pagination: {
        current_page: 1,
        per_page: per_page,
        total_items: 0,
        total_pages: 0,
      },
      error: "401",
    };
  }
}

export async function SSR_Users_Stats() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const response = await fetch(`${BeUrl}/users/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    const data = await response.json();
    const { summary, chart_data } = data.result.data;
    return { summary, chart_data };
  } catch (error: any) {
    return { summary: null, chart_data: null };
  }
}

"use server";

import { BeUrl } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";

export async function SSR_Requests(page = 1, per_page = 5) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const response = await fetch(
      `${BeUrl}/requests?page=${page}&per_page=${per_page}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { tags: ["requests"] },
        cache: "no-store",
      },
    );
    const res = await response.json();
    const { requests, pagination } = res.data;
    return { requests, pagination };
  } catch (error: any) {
    console.log("[SSR_Requests] Failed to fetch requests:", error?.message);
    return {
      requests: null,
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

export async function SSR_Reports(page = 1, per_page = 5) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const response = await fetch(
      `${BeUrl}/reports?page=${page}&per_page=${per_page}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { tags: ["reports"] },
        cache: "no-store",
      },
    );
    const res = await response.json();
    const { reports, pagination } = res.data;
    return { reports, pagination };
  } catch (error: any) {
    console.log("[SSR_Reports] Failed to fetch reports:", error?.message);
    return {
      reports: null,
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

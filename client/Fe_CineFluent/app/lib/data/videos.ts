import { BeUrl } from "@/app/lib/services/api_client";

export async function SSR_All_Videos(
  page = 1,
  per_page = 10,
  status = "all",
  search = "",
) {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: per_page.toString(),
      status: status,
    });

    if (search) queryParams.append("keyword", search);

    const res = await fetch(`${BeUrl}/videos?${queryParams.toString()}`, {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const { videos, pagination } = data?.data;
    return { videos, pagination };
  } catch (error: any) {
    console.error("[SSR_All_Videos] Error:", error.message);
    return {
      videos: [],
      pagination: {
        current_page: 1,
        per_page: per_page,
        total_items: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
      },
    };
  }
}

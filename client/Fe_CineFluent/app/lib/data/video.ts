import { BeUrl } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";

export async function SSR_Video_Slug(slug: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const response = await fetch(`${BeUrl}/videos/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { tags: ["videos", `video-${slug}`] },
    });
    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.log("[SSR_Video] Failed to fetch video:", error?.message);
    return null;
  }
}

export async function SSR_Video_All(
  source_type?: string,
  category_id?: string | number,
) {
  try {
    const params = new URLSearchParams();
    if (source_type) params.append("source_type", source_type);
    if (category_id) params.append("category_id", category_id.toString());

    const filter = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`${BeUrl}/videos${filter}`, {
      next: { tags: ["videos"] },
    });
    const data = await response.json();
    return {
      videos: data.data,
      pagination: data.pagination,
    };
  } catch (error: any) {
    console.log("[SSR_Video] Failed to fetch videos:", error?.message);
    return {
      videos: null,
      pagination: null,
    };
  }
}

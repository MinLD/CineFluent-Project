import { BeUrl } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";

export async function SSR_Video_Id(id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const response = await fetch(`${BeUrl}/videos/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    const data = await response.json();
    return data.data;
  } catch (error: any) {
    console.log("[SSR_Video] Failed to fetch video:", error?.message);
    return null;
  }
}

export async function SSR_Video_All() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;
    const response = await fetch(`${BeUrl}/videos`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    const data = await response.json();
    return {
      videos: data.data,
      pagination: data.pagination,
    };
  } catch (error: any) {
    console.log("[SSR_Video] Failed to fetch video:", error?.message);
    return {
      videos: null,
      pagination: null,
    };
  }
}

"use server";
import { BeUrl } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";

export async function SSR_Skills() {
  try {
    // ✅ Next 16 Fix: Explicit await on cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const response = await fetch(`${BeUrl}/user_skills`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    const res = await response.json();

    return res.data;
  } catch (error: any) {
    console.log("[SSR_Skills] Failed to fetch users:", error?.message);
    return [];
  }
}

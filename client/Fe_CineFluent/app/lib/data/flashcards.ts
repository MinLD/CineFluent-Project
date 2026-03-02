import { BeUrl } from "@/app/lib/services/api_client";
import { cookies } from "next/headers";

export async function SSR_Flashcards() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { flashcards: null, error: "401" };
    }

    const response = await fetch(`${BeUrl}/flashcards`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0, tags: ["flashcards"] },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const res = await response.json();
    const flashcards = res.data;

    return { flashcards, error: null };
  } catch (error: any) {
    console.log("[SSR_Flashcards] Failed to fetch flashcards:", error?.message);
    return {
      flashcards: null,
      error: "Error fetching flashcards",
    };
  }
}

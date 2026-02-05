"use server";

import { BeUrl } from "@/app/lib/services/api_client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

interface VideoFilters {
  source_type?: string;
  category_id?: number;
  level?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getVideosAction(filters?: VideoFilters) {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const url = `${BeUrl}/videos${params.toString() ? `?${params}` : ""}`;
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch videos");
    }

    const data = await response.json();
    return data.data || { videos: [], total: 0 };
  } catch (error) {
    console.error("Error fetching videos:", error);
    return { videos: [], total: 0 };
  }
}

export async function getVideoDetailAction(id: string, token?: string) {
  try {
    const response = await fetch(`${BeUrl}/videos/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch video detail");
    }

    const data = await response.json();
    return {
      video: data.data,
      success: true,
    };
  } catch (error) {
    console.error("Error fetching video detail:", error);
    return {
      video: null,
      success: false,
      error: "Failed to fetch video detail",
    };
  }
}

export async function importYouTubeVideoAction(
  youtubeUrl?: string,
  token?: string,
) {
  try {
    const response = await fetch(`${BeUrl}/videos/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: youtubeUrl,
      }),
    });

    const data = await response.json();
    revalidatePath("studies/movies");

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to import video",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error importing video:", error);
    return {
      success: false,
      error: "An error occurred while importing the video",
    };
  }
}

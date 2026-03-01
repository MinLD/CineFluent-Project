"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  Api_delete_video,
  Api_update_video,
  Api_get_videos,
  Api_import_youtube,
  Api_import_tmdb,
  Api_import_manual,
  Api_upload_subtitles,
  Api_delete_all_subtitles,
  Api_search_tmdb,
} from "@/app/lib/services/video";

export async function getVideosAction(
  page = 1,
  per_page = 12,
  category_id?: number | string,
  release_year?: number | string,
  source_type?: string,
  status?: string,
  keyword?: string,
) {
  try {
    const res = await Api_get_videos(
      page,
      per_page,
      category_id,
      release_year,
      source_type,
      status,
      keyword,
    );
    const { videos, pagination } = res.data.data;
    return {
      videos: videos || [],
      total: pagination?.total_items || 0,
      total_pages: pagination?.total_pages || 1,
    };
  } catch (error: any) {
    console.error("[getVideosAction] Error:", error.message);
    return { videos: [], total: 0, total_pages: 1 };
  }
}

export async function importVideoAction(prevState: any, formData: FormData) {
  try {
    const token = formData.get("token") as string;
    const source_type = formData.get("source_type") as string;

    if (!token) return { success: false, error: "Thiếu thông tin token" };

    let result;
    if (source_type === "youtube") {
      const url = formData.get("url") as string;
      result = await Api_import_youtube(url, token);
    } else if (source_type === "tmdb") {
      const tmdb_id = formData.get("tmdb_id") as string;
      result = await Api_import_tmdb(tmdb_id, token);
    } else {
      // Manual/Local uses full FormData with files
      result = await Api_import_manual(formData, token);
    }

    revalidateTag("videos", "default");
    revalidatePath("/admin");
    return {
      success: true,
      data: result.data,
      message: "Thêm phim thành công",
    };
  } catch (error: any) {
    console.error("[importVideoAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || "Thêm phim thất bại",
    };
  }
}

export async function updateVideoAction(
  videoId: number,
  data: any | FormData,
  token: string,
) {
  try {
    if (!token || !videoId) {
      return { success: false, error: "Thiếu thông tin cần thiết" };
    }

    const result = await Api_update_video(videoId, data, token);
    revalidateTag("videos", "default");
    revalidatePath("/admin");

    return {
      success: true,
      data: result.data,
      message: result.data.message,
    };
  } catch (error: any) {
    console.error("[updateVideoAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message || error.message || "Cập nhật thất bại",
    };
  }
}

export async function deleteVideoAction(videoId: number, token: string) {
  try {
    if (!token || !videoId) {
      return { success: false, error: "Thiếu thông tin cần thiết" };
    }

    const result = await Api_delete_video(videoId, token);
    revalidateTag("videos", "default");
    revalidatePath("/admin");

    return {
      success: true,
      message: result.data?.message || "Xóa phim thành công",
    };
  } catch (error: any) {
    console.error("[deleteVideoAction] Error:", error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message || "Xóa thất bại",
    };
  }
}

export async function uploadSubtitlesAction(
  id: number,
  formData: FormData,
  token: string,
) {
  try {
    const res = await Api_upload_subtitles(id, formData, token);
    revalidateTag("videos", "default");
    revalidatePath("/admin");
    return { success: true, message: res.data.message };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

export async function deleteSubtitlesAction(id: number, token: string) {
  try {
    await Api_delete_all_subtitles(id, token);
    revalidateTag("videos", "default");
    revalidatePath("/admin");
    return { success: true, message: "Đã xóa toàn bộ phụ đề" };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

export async function importYouTubeVideoAction(url: string, token: string) {
  try {
    const result = await Api_import_youtube(url, token);
    let parsedData = result.data;

    if (typeof result.data === "string") {
      const lines = result.data.trim().split("\n");
      const lastLine = lines[lines.length - 1];
      try {
        parsedData = JSON.parse(lastLine);
      } catch (e) {
        if (lines.length > 1) {
          parsedData = JSON.parse(lines[lines.length - 2]);
        }
      }
    }

    revalidateTag("videos", "default");
    revalidatePath("/admin");
    return {
      success: true,
      data: parsedData,
      message: parsedData?.message || "Import video thành công",
    };
  } catch (error: any) {
    console.error("[importYouTubeVideoAction] Error:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.message ||
        error.message ||
        "Import video thất bại",
    };
  }
}

export async function searchTMDBAction(query: string, token: string) {
  try {
    if (!token) return { success: false, error: "Thiếu token" };
    const res = await Api_search_tmdb(query, token);
    return {
      success: true,
      data: res.data.data || [],
      code: res.data.code,
    };
  } catch (error: any) {
    console.error("[searchTMDBAction] Error:", error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

import { axiosClient } from "./api_client";

const BASE_URL = "/videos";

export const Api_get_videos = (
  page: number,
  per_page: number,
  category_id?: number | string, // Giữ để lọc theo 1 danh mục (query param backend hỗ trợ)
  release_year?: number | string,
  source_type?: string,
  status?: string,
  keyword?: string,
) => {
  return axiosClient.get(BASE_URL, {
    params: {
      page,
      per_page,
      category_id,
      release_year,
      source_type,
      status,
      keyword,
    },
  });
};

export const Api_get_video_detail = (id: number) => {
  return axiosClient.get(`${BASE_URL}/${id}`);
};

export const Api_import_youtube = (url: string, token: string) => {
  return axiosClient.post(
    `${BASE_URL}/import/youtube`,
    { url },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const Api_import_tmdb = (tmdb_id: string, token: string) => {
  return axiosClient.post(
    `${BASE_URL}/import/local/tmdb`,
    { tmdb_id },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

export const Api_search_tmdb = (query: string, token: string) => {
  return axiosClient.get(`/tmdb/search`, {
    params: { query },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_import_manual = (formData: FormData, token: string) => {
  return axiosClient.post(`${BASE_URL}/import/local`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const Api_update_video = (id: number, data: FormData, token: string) => {
  return axiosClient.patch(`${BASE_URL}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const Api_upload_subtitles = (
  id: number,
  formData: FormData,
  token: string,
) => {
  return axiosClient.post(`${BASE_URL}/${id}/subtitles/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const Api_delete_all_subtitles = (id: number, token: string) => {
  return axiosClient.delete(`${BASE_URL}/${id}/subtitles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_delete_video = (id: number, token: string) => {
  return axiosClient.delete(`${BASE_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_create_request = (data: any, token: string) => {
  return axiosClient.post(`/requests/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_create_report = (data: any, token: string) => {
  return axiosClient.post(`/reports/`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

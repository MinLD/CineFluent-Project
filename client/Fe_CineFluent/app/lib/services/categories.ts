import { axiosClient } from "@/app/lib/services/api_client";

const get_all_categories = async (page: number, per_page: number) => {
  return axiosClient.get(`/categories?page=${page}&per_page=${per_page}`);
};
const Api_create_category = async (formData: FormData, token: string) => {
  return axiosClient.post(`/categories`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
const Api_update_category = async (
  categoryId: string,
  formData: FormData,
  token: string
) => {
  return axiosClient.patch(`/categories/${categoryId}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
const Api_delete_category = async (categoryId: string, token: string) => {
  return axiosClient.delete(`/categories/${categoryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
const Api_search_categories = async (
  keyword: string,
  page: number,
  per_page: number
) => {
  return axiosClient.get(
    `/categories/search?keyword=${keyword}&page=${page}&per_page=${per_page}`
  );
};
const Api_get_all_skills_in_category = async (
  categoryId: string,
  page: number,
  per_page: number
) => {
  return axiosClient.get(
    `/categories/${categoryId}/skills?page=${page}&per_page=${per_page}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
export {
  get_all_categories,
  Api_create_category,
  Api_update_category,
  Api_delete_category,
  Api_search_categories,
  Api_get_all_skills_in_category,
};

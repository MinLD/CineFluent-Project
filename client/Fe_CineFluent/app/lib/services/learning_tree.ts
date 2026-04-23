import { axiosClient } from "@/app/lib/services/api_client";

const BASE_URL = "/learning-tree";

export const Api_Get_Learning_Tree = async (token: string) => {
  return axiosClient.get(`${BASE_URL}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const Api_Get_Learning_Tree_Summary = async (token: string) => {
  return axiosClient.get(`${BASE_URL}/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

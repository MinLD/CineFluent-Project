import { axiosClient } from "@/app/lib/services/api_client";

export const Api_Admin_Dashboard_Overview = (
  token?: string,
  days = 7,
  top = 5,
) => {
  return axiosClient.get("/admin-dashboard/overview", {
    params: { days, top },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

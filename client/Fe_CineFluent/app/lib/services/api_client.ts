import axios from "axios";
const isServer = typeof window === "undefined";
export const BeUrl = isServer
  ? process.env.API_URL_INTERNAL || "http://backend:5000/api"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost/api";
export const FeUrl = process.env.NEXT_PUBLIC_FE_URL || "http://localhost";
export const API_BASE_URL = BeUrl; // Use BeUrl consistently

const axiosClientConfig = {
  baseURL: BeUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
};

export const axiosClient = axios.create(axiosClientConfig);

if (typeof window !== "undefined") {
  axiosClient.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      console.log("🚨 Axios Interceptor caught an error:", error);
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        console.log(
          "Token hết hạn hoặc không hợp lệ, đang tiến hành làm mới... (Client-side)",
        );
        try {
          const res = await axios.post(`${FeUrl}/api/auth/refreshtoken`);
          console.log("Đã làm mới token thành công:", res.data);
          const newAccessToken = res.data.access_token;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } catch (errorRefresh) {
          console.log("Refresh token error and unable to login:", errorRefresh);
          return Promise.reject(errorRefresh);
        }
      }
      return Promise.reject(error);
    },
  );
}

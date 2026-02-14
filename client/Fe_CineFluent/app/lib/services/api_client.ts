import axios from "axios";

const isServer = typeof window === "undefined";
const isProd = process.env.NODE_ENV === "production";

// Unified URL configuration from .env
export const FeApiProxyUrl =
  process.env.NEXT_PUBLIC_URL_FRONTEND_PROXY || "/apiFe";

export const BeUrl = isServer
  ? process.env.URL_BACKEND_INTERNAL ||
    process.env.URL_BACKEND_LOCAL ||
    "http://127.0.0.1:5000/api"
  : isProd
    ? process.env.URL_BACKEND_PRODUCTION || ""
    : FeApiProxyUrl; // On client, always use the proxy

export const FeUrl = isProd
  ? process.env.NEXT_PUBLIC_URL_FRONTEND_PRODUCTION || ""
  : process.env.NEXT_PUBLIC_URL_FRONTEND_LOCAL || "";

export const API_BASE_URL = BeUrl;

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
          const res = await axios.post(`${FeApiProxyUrl}/auth/refreshtoken`);
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

import axios from "axios";

const isServer = typeof window === "undefined";
const isProd = process.env.NODE_ENV === "production";

// Unified URL configuration from .env
export const FeApiProxyUrl =
  process.env.NEXT_PUBLIC_URL_FRONTEND_PROXY || "/apiFe";
// --- 1. Cấu hình Backend URL (Dùng cho Server-Side Rendering) ---
export const BeUrl = isServer
  ? process.env.URL_BACKEND_INTERNAL ||
    process.env.URL_BACKEND_LOCAL ||
    "http://127.0.0.1:5000/api"
  : FeApiProxyUrl;

// --- 2. Cấu hình Frontend URL ---
export const FeUrl = isProd
  ? process.env.NEXT_PUBLIC_URL_FRONTEND_PRODUCTION || ""
  : process.env.NEXT_PUBLIC_URL_FRONTEND_LOCAL || "http://localhost:3000";

export const API_BASE_URL = isServer ? BeUrl : isProd ? "/api" : BeUrl;

const axiosClientConfig = {
  baseURL: BeUrl,
  timeout: 60000,
  withCredentials: true, // Mang theo cookie tự động
  headers: {
    "Content-Type": "application/json",
  },
};

export const axiosClient = axios.create(axiosClientConfig);

if (typeof window !== "undefined") {
  // Biến dùng để xử lý Race Condition khi refresh token
  let isRefreshing = false;
  let failedQueue: any[] = [];

  const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    failedQueue = [];
  };

  // --- Request Interceptor ---
  axiosClient.interceptors.request.use((config) => {
    // Không cần tự bóc cookie ở đây nữa!
    // Vì withCredentials: true đã tự động gửi cookie httpOnly lên Next Proxy (/apiFe) rồi.
    return config;
  });

  // --- Response Interceptor ---
  axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      console.log(
        "🚨 Axios Interceptor caught an error:",
        error?.response?.status,
      );

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // 1. Đang có thằng đi refresh rồi, mảng queue lưu lại các request đang hóng
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              // 2. Refresh xong, gọi lại request cũ
              return axiosClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;
        console.log("🔄 Đang làm mới token... (Client-side)");

        try {
          // Gọi API refresh token
          const res = await axios.post(
            `${FeApiProxyUrl}/auth/refreshtoken`,
            {},
            {
              withCredentials: true,
            },
          );

          const newAccessToken = res.data.access_token || res.data.token;
          console.log("✅ Làm mới token thành công!");

          // Bắn Event cho AuthContext cập nhật State
          window.dispatchEvent(
            new CustomEvent("auth-token-refreshed", {
              detail: { token: newAccessToken },
            }),
          );

          // Giải cứu các request đang chờ trong Queue
          processQueue(null, newAccessToken);
          return axiosClient(originalRequest);
        } catch (errorRefresh) {
          console.error("❌ Refresh token thất bại:", errorRefresh);
          processQueue(errorRefresh, null);

          // Bắn Event báo hiệu cho toàn App dọn dẹp biến state (cửa sổ login sẽ hiện ra)
          window.dispatchEvent(new CustomEvent("auth-logged-out"));

          return Promise.reject(errorRefresh);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    },
  );
}

import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

const authPaths = ["/login", "/register"];
const privatePathsAdmin = ["/admin"];
const privatePaths = [
  "/settings",
  "/flashcards",
  "/request-movie",
  "/studies/roadmap",
];

// Helper to get backend URL inside middleware
const getBackendUrl = () => {
  return (
    process.env.URL_BACKEND_INTERNAL ||
    process.env.URL_BACKEND_LOCAL ||
    "http://127.0.0.1:5000/api"
  );
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  let accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let roles: string[] | null = null;
  let shouldRefresh = false;

  if (accessToken) {
    try {
      const decoded = jose.decodeJwt(accessToken);
      roles = (decoded.roles as string[]) || [];

      // Kiểm tra xem token có sắp hết hạn (trong vòng 10 giây tới) không
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now + 10) {
        shouldRefresh = true;
      }
    } catch (error) {
      console.error("[Middleware] JWT Decode error:", error);
      shouldRefresh = true; // Token hỏng thì thử refresh
    }
  } else if (refreshToken) {
    // Không có access_token nhưng có refresh_token -> cần refresh
    shouldRefresh = true;
  }

  // --- LOGIC REFRESH TOKEN TẠI MÁY CHỦ ---
  if (shouldRefresh && refreshToken) {
    try {
      console.log("[Middleware] Access token expired or missing. Refreshing...");
      const backendUrl = getBackendUrl();
      const refreshRes = await fetch(`${backendUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${refreshToken}`,
          "Content-Type": "application/json",
        },
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newAccessToken = data.data.access_token;

        if (newAccessToken) {
          console.log("[Middleware] Refresh success!");
          accessToken = newAccessToken;

          // Giải mã token mới để lấy role
          const newDecoded = jose.decodeJwt(newAccessToken);
          roles = (newDecoded.roles as string[]) || [];

          // 1. Cập nhật cookie cho trình duyệt (Response)
          response.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });

          // 2. Cập nhật cookie cho Server Components phía sau (Request)
          // Để các hàm cookies().get("access_token") thấy ngay token mới
          request.cookies.set("access_token", newAccessToken);
          
          // Tạo một bản sao response với cookies mới
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set("access_token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });
        }
      } else {
        console.error("[Middleware] Refresh API failed with status:", refreshRes.status);
      }
    } catch (err: any) {
      console.error("[Middleware] Refresh flow error:", err.message);
    }
  }

  // --- LOGIC PHÂN QUYỀN VÀ ĐIỀU HƯỚNG ---
  
  // Admin checking
  if (privatePathsAdmin.some((path) => pathname.startsWith(path))) {
    if (!roles?.includes("admin")) {
      console.log("[middleware] Restricted: Not admin — redirect /");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Auth paths (Login/Register)
  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (accessToken && !shouldRefresh) { // Chỉ redirect nếu có token hợp lệ và không lỗi
      console.log("[middleware] Already logged in — redirect /");
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Private paths
  if (privatePaths.some((path) => pathname.startsWith(path))) {
    if (!accessToken) {
      console.log("[middleware] Private path but no valid token — redirect /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Admin redirect from home
  if (pathname === "/") {
    if (roles?.includes("admin")) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};

export const proxy = middleware;
export default proxy;

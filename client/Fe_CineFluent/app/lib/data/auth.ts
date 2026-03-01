// lib/data/auth.ts
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { BeUrl } from "@/app/lib/services/api_client";

export async function SSR_Auth() {
  try {
    const cookieStore = await cookies();
    let token = cookieStore.get("access_token")?.value;
    const refresh_token = cookieStore.get("refresh_token")?.value;

    if (!token && !refresh_token) {
      return { roles: null, userId: null, token: null, profile_user: null };
    }

    // Hàm thực hiện lấy profile
    const fetchProfile = async (accessToken: string) => {
      const decoded: any = jwtDecode(accessToken);
      if (!decoded?.sub) throw new Error("Invalid token");
      const response = await axios.get(`${BeUrl}/users/${decoded.sub}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        roles: decoded.roles || [],
        userId: decoded.sub,
        token: accessToken,
        profile_user: response.data.data,
      };
    };

    // Thử lấy profile với token hiện tại
    if (token) {
      try {
        return await fetchProfile(token);
      } catch (e: any) {
        console.warn("[SSR_Auth] Access token invalid, trying refresh...");
      }
    }

    // Nếu access token hỏng hoặc không có, nhưng có refresh token -> Thử refresh
    if (refresh_token) {
      try {
        console.log("[SSR_Auth] Attempting server-side token refresh...");
        const refreshRes = await axios.post(
          `${BeUrl}/auth/refresh`,
          {},
          {
            headers: { Authorization: `Bearer ${refresh_token}` },
          },
        );
        const newToken = refreshRes.data.data.access_token;
        if (newToken) {
          console.log("[SSR_Auth] Server-side refresh success!");
          return await fetchProfile(newToken);
        }
      } catch (refreshErr: any) {
        console.error(
          "[SSR_Auth] Server-side refresh failed:",
          refreshErr.message,
        );
      }
    }

    return { roles: null, userId: null, token: null, profile_user: null };
  } catch (error: any) {
    console.warn("[SSR_Auth] Authentication error:", error.message);
    return { roles: null, userId: null, token: null, profile_user: null };
  }
}

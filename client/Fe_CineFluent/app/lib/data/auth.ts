// lib/data/auth.ts
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { BeUrl } from "@/app/lib/services/api_client";

/**
 * SSR_Auth bây giờ cực kỳ đơn giản:
 * Nó chỉ đọc token từ Cookie (mà Middleware đã đảm bảo là luôn xịn)
 * Và đi lấy Profile User về.
 */
export async function SSR_Auth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { roles: null, userId: null, token: null, profile_user: null };
    }

    // Giải mã để lấy thông tin cơ bản
    const decoded: any = jwtDecode(token);
    if (!decoded?.sub) {
      return { roles: null, userId: null, token: null, profile_user: null };
    }

    // Lấy profile thực tế từ Backend
    // Lưu ý: Chúng ta dùng axios hoặc fetch trực tiếp ở đây,
    // Middleware đã đảm bảo token này hợp lệ.
    try {
      const response = await axios.get(`${BeUrl}/users/${decoded.sub}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        roles: decoded.roles || [],
        userId: decoded.sub,
        token: token,
        profile_user: response.data.data,
      };
    } catch (profileErr: any) {
       console.error("[SSR_Auth] Error fetching profile:", profileErr.message);
       // Nếu không lấy được profile (có thể server chết), vẫn trả về thông tin từ token
       return {
         roles: decoded.roles || [],
         userId: decoded.sub,
         token: token,
         profile_user: null,
       };
    }
  } catch (error: any) {
    console.warn("[SSR_Auth] Authentication error:", error.message);
    return { roles: null, userId: null, token: null, profile_user: null };
  }
}

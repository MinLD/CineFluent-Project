// lib/data/auth.ts
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { BeUrl } from "@/app/lib/services/api_client";

export async function SSR_Auth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return { roles: null, userId: null, token: null, profile_user: null };
    }

    let decoded: any;
    try {
      decoded = jwtDecode(token);
    } catch (decodeError) {
      console.error("[SSR_Auth] Token decode error:", decodeError);
      return { roles: null, userId: null, token: null, profile_user: null };
    }

    if (!decoded?.sub) {
      console.warn("[SSR_Auth] Invalid token structure: missing 'sub'");
      return { roles: null, userId: null, token: null, profile_user: null };
    }

    const response = await axios.get(`${BeUrl}/users/${decoded.sub}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("SSR_Auth fetched user profile:", response.data.data);

    return {
      roles: decoded.roles || [],
      userId: decoded.sub,
      token: token,
      profile_user: response.data.data,
    };
  } catch (error: any) {
    console.warn(
      "[SSR_Auth] Authentication error - Client will handle:",
      error.message
    );
    return { roles: null, userId: null, token: null, profile_user: null };
  }
}

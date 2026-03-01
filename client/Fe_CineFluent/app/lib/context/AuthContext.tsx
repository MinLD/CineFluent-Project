"use client";

import { axiosClient } from "@/app/lib/services/api_client";
import { Api_Profile_User } from "@/app/lib/services/user";
import { Ty_User } from "@/app/lib/types/users";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";

export interface InitialLoginProps {
  roles: string[] | [];
  userId: string | "";
  token: string | "";
  profile_user?: Ty_User | undefined;
}

interface AuthState {
  token: string | null;
  userId: string | null;
  roles: string[] | null;
  profile_user?: Ty_User;
  updateAuth?: (payload: InitialLoginProps) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[] | null>([]);
  const [profile_user, setProfile_user] = useState<Ty_User | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  useEffect(() => {
    const fetchData = async () => {
      if (token && !profile_user && userId) {
        console.log("⚠️ AuthContext: Đang lấy lại Profile cho User:", userId);
        try {
          const res = await Api_Profile_User(userId, token);
          if (res.data?.data) {
            setProfile_user(res.data.data);
            console.log("✅ AuthContext: Đã cập nhật xong Profile mới.");
          }
        } catch (error) {
          console.error("❌ AuthContext: Không thể fetch profile:", error);
        }
      } else if (!profile_user && !token) {
        console.log("⚠️ AuthContext: Kiểm tra phiên đăng nhập ban đầu...");
        try {
          // Fallback cho lần đầu mount hoặc khi token chưa được set vào state
          await axios.get("/apiFe/auth/whoami");
          console.log("✅ Client: Phiên đăng nhập hợp lệ.");
          router.refresh();
        } catch (error) {
          console.log("❌ Client: Không có phiên đăng nhập.");
        }
      }
    };
    fetchData();
  }, [profile_user, token, userId]);

  // Lắng nghe sự kiện Refresh Token từ Interceptor
  useEffect(() => {
    const handleRefreshed = (event: any) => {
      const newToken = event.detail.token;
      if (newToken) {
        console.log("🔄 AuthContext: Cập nhật token mới từ Interceptor.");
        try {
          const decoded: any = jwtDecode(newToken);
          setToken(newToken);
          setUserId(decoded.sub || null);
          setRoles(decoded.roles || []);
        } catch (e) {
          console.error("❌ AuthContext: Lỗi decode token refreshed:", e);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth-token-refreshed", handleRefreshed);
      return () =>
        window.removeEventListener("auth-token-refreshed", handleRefreshed);
    }
  }, []);

  console.log("roles in contexxt", roles);
  const updateAuth = useCallback((payload: InitialLoginProps) => {
    setToken((prev) => (prev !== payload.token ? payload.token || null : prev));
    setUserId((prev) =>
      prev !== payload.userId ? payload.userId || null : prev,
    );
    setRoles((prev) =>
      JSON.stringify(prev) !== JSON.stringify(payload.roles)
        ? payload.roles || null
        : prev,
    );
    setProfile_user(payload.profile_user);
    setIsLoading(false);
  }, []);
  const contextValue = useMemo(
    () => ({
      token,
      userId,
      roles,
      profile_user,
      updateAuth,
      isLoading,
    }),
    [token, userId, roles, profile_user, updateAuth, isLoading],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

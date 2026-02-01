"use client";

import { axiosClient } from "@/app/lib/services/api_client";
import { Ty_User } from "@/app/lib/types/users";
import axios from "axios";
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
      if (!profile_user) {
        console.log("⚠️ Client: Kiểm tra phiên đăng nhập...");
        try {
          await axiosClient.get("/auth/whoami", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          console.log(
            "✅ Client: Phiên đăng nhập hợp lệ (hoặc đã refresh thành công)."
          );
          router.refresh();
        } catch (error) {
          console.log("❌ Client: Phiên đăng nhập hết hạn. Không thể refresh.");
        }
      }
    };
    fetchData();
  }, [profile_user]);

  console.log("roles in contexxt", roles);
  const updateAuth = useCallback((payload: InitialLoginProps) => {
    setToken((prev) => (prev !== payload.token ? payload.token || null : prev));
    setUserId((prev) =>
      prev !== payload.userId ? payload.userId || null : prev
    );
    setRoles((prev) =>
      JSON.stringify(prev) !== JSON.stringify(payload.roles)
        ? payload.roles || null
        : prev
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
    [token, userId, roles, profile_user, updateAuth, isLoading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

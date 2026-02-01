  import AuthClientInitializer from "@/app/components/auth/AuthClientInitializer";
  import { SSR_Auth } from "@/app/lib/data/auth";

  export default async function AuthSSRInit() {
    try {
      const { roles, userId, token, profile_user } = await SSR_Auth();
      console.log("[AuthSSRInit] SSR_Auth roles:", roles);
      const initialLogin = {
        roles: roles || [],
        userId: userId || "",
        token: token || "",
        profile_user: profile_user || undefined,
      };
      return <AuthClientInitializer initialLogin={initialLogin} />;
    } catch (error) {
      return null;
    }
  }

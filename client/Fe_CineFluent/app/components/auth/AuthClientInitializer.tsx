"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/lib/hooks/useAuth";
import type { InitialLoginProps } from "@/app/lib/context/AuthContext";

export default function AuthClientInitializer({
  initialLogin,
}: {
  initialLogin: InitialLoginProps;
}) {
  const { updateAuth } = useAuth();
  useEffect(() => {
    if (updateAuth) {
      updateAuth(initialLogin);
    }
  }, [updateAuth, initialLogin]);

  return null;
}

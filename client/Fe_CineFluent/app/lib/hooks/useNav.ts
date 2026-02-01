import { NavContext } from "@/app/lib/context/nav";
import { useContext } from "react";

export function useNav() {
  const context = useContext(NavContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

"use client";

import { createContext, useState, ReactNode, useEffect } from "react";

interface NavState {
  isOpenMenuHamsburg: boolean;
  setIsOpenMenuHamsburg: (isOpen: boolean) => void;
  openHamsburg: () => void;
  closeHamsburg: () => void;
  isTypeGeneralDashboard: string;
  setIsTypeGeneralDashboard: (isTypeGeneralDashboard: string) => void;
}

export const NavContext = createContext<NavState | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [isOpenMenuHamsburg, setIsOpenMenuHamsburg] = useState(false);
  const openHamsburg = () => setIsOpenMenuHamsburg(true);
  const closeHamsburg = () => setIsOpenMenuHamsburg(false);
  const [isTypeGeneralDashboard, setIsTypeGeneralDashboard] =
    useState("Dashboard");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedValue = localStorage.getItem("isTypeGeneralDashboard");
      if (storedValue) {
        setIsTypeGeneralDashboard(storedValue);
      }
    }
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("isTypeGeneralDashboard", isTypeGeneralDashboard);
    }
  }, [isTypeGeneralDashboard]);

  return (
    <NavContext.Provider
      value={{
        isOpenMenuHamsburg,
        setIsOpenMenuHamsburg,
        openHamsburg,
        closeHamsburg,
        isTypeGeneralDashboard,
        setIsTypeGeneralDashboard,
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

"use client";

import { useEffect } from "react";
import { useNav } from "@/app/lib/hooks/useNav";
import DecoratedSidebar from "@/app/components/decorated_sidebar";

function HamburgerMenu() {
  const { isOpenMenuHamsburg, closeHamsburg } = useNav();

  useEffect(() => {
    if (isOpenMenuHamsburg) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpenMenuHamsburg]);

  return (
    <>
      <div
        className={`${
          isOpenMenuHamsburg ? "block" : "hidden"
        } fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity`}
        onClick={closeHamsburg}
      />

      <div
        className={`fixed top-0 left-0 z-50 w-[85vw] max-w-[300px] bg-white transition-transform duration-300 ease-in-out ${
          isOpenMenuHamsburg ? "translate-x-0" : "-translate-x-full"
        } 
        h-[100dvh]`}
      >
        <DecoratedSidebar onClose={closeHamsburg} />
      </div>
    </>
  );
}

export default HamburgerMenu;

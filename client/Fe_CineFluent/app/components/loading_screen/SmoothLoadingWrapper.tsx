"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "./index";

export default function SmoothLoadingWrapper() {
  const [isChecking, setIsChecking] = useState(true);

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const hasSeenLoading = sessionStorage.getItem("seen_loading");

    if (hasSeenLoading) {
      setIsVisible(false);
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        sessionStorage.setItem("seen_loading", "true");
      }, 2500);

      return () => clearTimeout(timer);
    }

    setIsChecking(false);
  }, []);

  if (isChecking) return null;

  return <AnimatePresence>{isVisible && <LoadingScreen />}</AnimatePresence>;
}

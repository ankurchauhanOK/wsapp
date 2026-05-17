"use client";

import { useState, useEffect } from "react";

export function usePWAStatus() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleChange = () => checkStandalone();
    mediaQuery.addEventListener("change", handleChange);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  return { isStandalone, canInstall, isOnline };
}

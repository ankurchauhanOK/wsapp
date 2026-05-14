"use client";

import { useEffect, useState } from "react";
import { useOfflineQueueStore } from "@/lib/store";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function OfflineSync() {
  const [online, setOnline] = useState(true);
  const { queue, processQueue } = useOfflineQueueStore();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => {
      setOnline(true);
      processQueue();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [processQueue]);

  useEffect(() => {
    if (!online) {
      setShowBanner(true);
    } else {
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [online]);

  if (!showBanner && online) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto transition-all duration-300 ${
        showBanner ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div
        className={`rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 ${
          online ? "bg-green-600" : "bg-amber-600"
        } text-white`}
      >
        {online ? (
          <>
            <Wifi className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Back online</p>
              {queue.length > 0 && (
                <p className="text-xs opacity-90">
                  Syncing {queue.length} pending {queue.length === 1 ? "action" : "actions"}...
                </p>
              )}
            </div>
            <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">You&apos;re offline</p>
              <p className="text-xs opacity-90">Changes will sync when connected</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

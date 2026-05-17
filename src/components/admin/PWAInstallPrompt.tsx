"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    const storedDismissed = localStorage.getItem("kiranax-install-dismissed");
    if (storedDismissed) {
      const dismissedAt = parseInt(storedDismissed, 10);
      // Re-show after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone && !storedDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Also show for iOS users after a delay
    if (iosDevice && !standalone && !storedDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => {
        window.removeEventListener("beforeinstallprompt", handler);
        clearTimeout(timer);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    localStorage.setItem("kiranax-install-dismissed", Date.now().toString());
  };

  if (isStandalone) return null;
  if (!isVisible || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] max-w-sm mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Smartphone className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900">Install Kiranax Admin</h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {isIOS
                ? "Tap the share button and then \"Add to Home Screen\" for faster access."
                : "Add to your home screen for faster scanning, billing & inventory management."}
            </p>
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="mt-2.5 inline-flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 active:scale-95 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                Install App
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors shrink-0"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

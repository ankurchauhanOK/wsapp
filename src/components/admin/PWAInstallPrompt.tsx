"use client";

import { useState, useEffect } from "react";
import { Download, X, Smartphone, Share2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallPromptProps {
  context?: "admin" | "store";
}

export function PWAInstallPrompt({ context = "admin" }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iosDevice);

    const storageKey = context === "admin" ? "kiranax-install-dismissed" : "kiranax-store-install-dismissed";
    const storedDismissed = localStorage.getItem(storageKey);
    if (storedDismissed) {
      const dismissedAt = parseInt(storedDismissed, 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!standalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show immediately for iOS (no delay)
    if (iosDevice && !standalone && !storedDismissed) {
      setIsVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [context]);

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
    const storageKey = context === "admin" ? "kiranax-install-dismissed" : "kiranax-store-install-dismissed";
    localStorage.setItem(storageKey, Date.now().toString());
  };

  if (isStandalone) return null;
  if (!isVisible || dismissed) return null;

  const title = context === "admin" ? "Kiranax Admin" : "Kiranax Store";
  const subtitle = context === "admin"
    ? "Faster scanning, billing & inventory"
    : "Order groceries faster from your home screen";

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] max-w-sm mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-gray-900">Install {title}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {subtitle}
            </p>

            {isIOS ? (
              <div className="mt-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Share2 className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">Tap the share button</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">+</span>
                  <span className="text-xs font-semibold text-amber-800">Then "Add to Home Screen"</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleInstall}
                className="mt-3 inline-flex items-center gap-1.5 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 active:scale-95 transition-all shadow-sm"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors shrink-0 -mt-1 -mr-1"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

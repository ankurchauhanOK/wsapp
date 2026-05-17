"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/store/BottomNav";
import { PWAInstallPrompt } from "@/components/admin/PWAInstallPrompt";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <BottomNav />
      <PWAInstallPrompt context="store" />
    </div>
  );
}

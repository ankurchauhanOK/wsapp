import type { ReactNode } from "react";
import { BottomNav } from "@/components/store/BottomNav";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <BottomNav />
    </div>
  );
}

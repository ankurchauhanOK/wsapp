"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Scan,
  Settings,
  Barcode,
} from "lucide-react";

const BOTTOM_NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/admin/inventory", label: "Stock", icon: Package },
  { href: "/admin/scanner/billing", label: "Scan", icon: Scan, isCenter: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/settings", label: "More", icon: Settings },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3 flex flex-col items-center"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center shadow-frap transition-all active:scale-95",
                    isActive
                      ? "bg-green-600 text-white"
                      : "bg-green-600 text-white"
                  )}
                >
                  <Barcode className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-medium text-gray-600 mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors",
                isActive ? "text-green-600" : "text-gray-400"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isActive ? "text-green-600" : "text-gray-400")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

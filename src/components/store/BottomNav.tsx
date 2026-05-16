"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, Grid3X3, ShoppingCart, User } from "lucide-react";
import { useCartStore } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/store", label: "Home", icon: Home },
  { href: "/store/orders", label: "Order Again", icon: ShoppingBag },
  { href: "/store/categories", label: "Categories", icon: Grid3X3 },
  { href: "/store/cart", label: "Cart", icon: ShoppingCart },
];

export function BottomNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isCart = item.href === "/store/cart";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-16 h-full relative",
                isActive ? "text-green-600" : "text-gray-400"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {isCart && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-green-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-green-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

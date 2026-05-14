"use client";

import { useCartStore } from "@/lib/store";
import { ShoppingCart, Heart, Clock, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StoreHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function StoreHeader({ title, showBack, onBack }: StoreHeaderProps) {
  const itemCount = useCartStore((s) => s.itemCount());
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={onBack} className="p-1 -ml-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <Link href="/store" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight">{title || "Kiranax"}</h1>
              <p className="text-[10px] text-gray-500 leading-tight">Grocery Store</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/store/favorites">
            <Button variant="ghost" size="icon" className="relative">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/store/orders">
            <Button variant="ghost" size="icon">
              <Clock className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/store/cart" className="relative">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
      {menuOpen && (
        <div className="absolute top-14 right-2 bg-white border rounded-lg shadow-lg p-2 z-50">
          <Link href="/store" className="block px-3 py-2 text-sm hover:bg-gray-50 rounded">Home</Link>
          <Link href="/store/orders" className="block px-3 py-2 text-sm hover:bg-gray-50 rounded">Orders</Link>
          <Link href="/store/favorites" className="block px-3 py-2 text-sm hover:bg-gray-50 rounded">Favorites</Link>
        </div>
      )}
    </header>
  );
}

"use client";

import { useCartStore } from "@/lib/store";
import { ShoppingCart, Heart, Clock } from "lucide-react";
import Link from "next/link";

interface StoreHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function StoreHeader({ title, showBack, onBack }: StoreHeaderProps) {
  const itemCount = useCartStore((s) => s.itemCount());

  return (
    <header className="sticky top-0 z-40 bg-white shadow-nav">
      <div className="flex items-center justify-between px-4 h-16 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={onBack} className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <Link href="/store" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-gray-900">{title || "Kiranax"}</h1>
              <p className="text-[10px] text-gray-500 leading-tight">Grocery Store</p>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-0.5">
          <Link href="/store/favorites">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
              <Heart className="h-5 w-5 text-gray-700" />
            </button>
          </Link>
          <Link href="/store/orders">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
              <Clock className="h-5 w-5 text-gray-700" />
            </button>
          </Link>
          <Link href="/store/cart" className="relative">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors relative">
              <ShoppingCart className="h-5 w-5 text-gray-700" />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-green-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function CartDrawer() {
  const { items, updateQuantity, removeItem, subtotal, clearCart } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <ShoppingBag className="h-16 w-16 mb-4 text-gray-300" />
        <p className="font-medium text-gray-900">Your cart is empty</p>
        <p className="text-sm mt-1">Add items to get started</p>
        <Link href="/store">
          <Button className="mt-4 rounded-full" variant="outline">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex items-center justify-between py-3">
          <h2 className="font-semibold text-lg text-gray-900">
            {items.length} {items.length === 1 ? "item" : "items"}
          </h2>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 flex items-center gap-1 font-medium"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-white rounded-xl shadow-card p-2 flex items-center gap-3"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                <span className="text-lg">🛒</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight line-clamp-1 text-gray-900">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatPrice(item.product.price)} / {item.product.unit_type}
                </p>
                <p className="text-sm font-semibold text-green-600">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-7 text-center text-sm font-semibold text-gray-900">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-900">{formatPrice(subtotal())}</span>
        </div>
        <Separator />
        <Link href="/store/checkout">
          <Button className="w-full h-12 text-base font-semibold rounded-full shadow-lg">
            Checkout - {formatPrice(subtotal())}
          </Button>
        </Link>
      </div>
    </div>
  );
}

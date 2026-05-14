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
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShoppingBag className="h-16 w-16 mb-4" />
        <p className="font-medium">Your cart is empty</p>
        <p className="text-sm mt-1">Add items to get started</p>
        <Link href="/store">
          <Button className="mt-4" variant="outline">
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
          <h2 className="font-semibold text-lg">
            {items.length} {items.length === 1 ? "item" : "items"}
          </h2>
          <button
            onClick={clearCart}
            className="text-sm text-red-500 flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" /> Clear
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center gap-3 bg-white rounded-lg p-2"
            >
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-lg">🛒</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight line-clamp-1">
                  {item.product.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatPrice(item.product.price)} / {item.product.unit_type}
                </p>
                <p className="text-sm font-semibold text-green-700">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="h-7 w-7"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-7 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="h-7 w-7"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal())}</span>
        </div>
        <Separator />
        <Link href="/store/checkout">
          <Button className="w-full h-12 text-base font-semibold">
            Checkout - {formatPrice(subtotal())}
          </Button>
        </Link>
      </div>
    </div>
  );
}

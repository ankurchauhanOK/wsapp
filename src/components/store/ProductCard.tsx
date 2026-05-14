"use client";

import type { Product } from "@/types";
import { formatPrice, stockStatus } from "@/lib/utils";
import { useCartStore, useFavoritesStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Minus } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, items } = useCartStore();
  const { isFavorite, toggle } = useFavoritesStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const fav = isFavorite(product.id);
  const stock = stockStatus(product.stock, product.low_stock_threshold);

  const handleAdd = () => {
    addItem(product);
  };

  const handleQtyChange = (delta: number) => {
    const item = items.find((i) => i.product.id === product.id);
    if (item) {
      const newQty = item.quantity + delta;
      updateQuantity(product.id, newQty);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-3 flex gap-3 relative transition-shadow hover:shadow-lg">
      <button
        onClick={() => toggle(product.id)}
        className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Heart
          className={`h-4 w-4 ${
            fav ? "fill-red-500 text-red-500" : "text-gray-300"
          }`}
        />
      </button>
      <Link
        href={`/store/product/${product.id}`}
        className="shrink-0"
      >
        <div className="w-20 h-20 bg-green-50 rounded-xl flex items-center justify-center overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl">🛒</span>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/store/product/${product.id}`}>
          <h3 className="font-medium text-sm leading-tight line-clamp-2 text-gray-900">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">
          {product.type === "weight" ? "per kg" : `per ${product.unit_type}`}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="font-bold text-base text-green-600">
              {formatPrice(product.price)}
            </p>
            {stock === "low_stock" && (
              <Badge variant="warning" className="text-[9px] px-1.5 py-0 mt-0.5">
                Only {product.stock} left
              </Badge>
            )}
            {stock === "out_of_stock" && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 mt-0.5">
                Out of stock
              </Badge>
            )}
          </div>
          {stock === "out_of_stock" ? null : cartItem ? (
            <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleQtyChange(-1)}
                className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center text-sm font-semibold text-gray-900">
                {cartItem.quantity}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleQtyChange(1)}
                className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleAdd} className="h-8 px-4 text-xs rounded-full">
              <Plus className="h-3 w-3 mr-1" /> Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

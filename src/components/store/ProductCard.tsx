"use client";

import type { Product } from "@/types";
import { formatPrice, stockStatus } from "@/lib/utils";
import { useCartStore, useFavoritesStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Heart, Plus, Minus } from "lucide-react";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "list";
}

export function ProductCard({ product, variant = "list" }: ProductCardProps) {
  const { addItem, updateQuantity, items } = useCartStore();
  const { isFavorite, toggle } = useFavoritesStore();
  const cartItem = items.find((i) => i.product.id === product.id);
  const fav = isFavorite(product.id);
  const stock = stockStatus(product.stock, product.low_stock_threshold);

  const tags = product.tags ? product.tags.split(",").filter(Boolean) : [];
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  const handleAdd = () => {
    if (stock !== "out_of_stock") addItem(product);
  };

  const handleQtyChange = (delta: number) => {
    const item = items.find((i) => i.product.id === product.id);
    if (item) {
      const newQty = item.quantity + delta;
      updateQuantity(product.id, newQty);
    }
  };

  const weightLabel = product.weight_grams
    ? product.weight_grams >= 1000
      ? `${product.weight_grams / 1000} kg`
      : `${product.weight_grams} g`
    : product.unit_type;

  const perUnitPrice = product.weight_grams
    ? `₹${Math.round((product.price / product.weight_grams) * 1000)}/kg`
    : "";

  if (variant === "list") {
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
        <Link href={`/store/product/${product.id}`} className="shrink-0">
          <div className="w-20 h-20 bg-green-50 rounded-xl flex items-center justify-center overflow-hidden">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
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
          <p className="text-xs text-gray-500 mt-0.5">{weightLabel}</p>
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
                <button
                  onClick={() => handleQtyChange(-1)}
                  className="h-7 w-7 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-gray-900">
                  {cartItem.quantity}
                </span>
                <button
                  onClick={() => handleQtyChange(1)}
                  className="h-7 w-7 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                className="h-8 px-4 text-xs font-semibold rounded-md border border-green-600 text-green-600 bg-green-50 hover:bg-green-100 transition-colors"
              >
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (Blinkit style)
  return (
    <div className="bg-white rounded-xl shadow-card p-2.5 relative transition-shadow hover:shadow-lg flex flex-col">
      {/* Favorite */}
      <button
        onClick={() => toggle(product.id)}
        className="absolute top-3 right-3 z-10 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
      >
        <Heart
          className={`h-4 w-4 ${
            fav ? "fill-red-500 text-red-500" : "text-gray-300"
          }`}
        />
      </button>

      {/* Tags overlay */}
      {tags.includes("Bought Earlier") && (
        <div className="absolute top-3 left-3 z-10 bg-blue-50 text-blue-700 text-[9px] font-semibold px-1.5 py-0.5 rounded">
          Bought Earlier
        </div>
      )}

      {/* Image */}
      <Link href={`/store/product/${product.id}`} className="block mb-2">
        <div className="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          ) : (
            <span className="text-4xl">🛒</span>
          )}
        </div>
      </Link>

      {/* Weight pill */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className="w-2.5 h-2.5 rounded-full border border-green-600 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
        </div>
        <span className="text-[11px] text-gray-500 font-medium">{weightLabel}</span>
        {tags.includes("No Maida") && (
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded font-medium">No Maida</span>
        )}
      </div>

      {/* Name */}
      <Link href={`/store/product/${product.id}`}>
        <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 mb-1">
          {product.name}
        </h3>
      </Link>

      {/* Rating placeholder */}
      <div className="flex items-center gap-1 mb-1.5">
        <div className="flex">
          {[1, 2, 3, 4].map((s) => (
            <svg key={s} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <svg className="w-3 h-3 text-gray-300 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400">{Math.floor(Math.random() * 2000) + 100}</span>
      </div>

      {/* Price */}
      <div className="mt-auto">
        {discount > 0 && (
          <p className="text-[11px] text-blue-600 font-semibold">{discount}% OFF</p>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold text-gray-900">
            {formatPrice(product.price)}
          </span>
          {product.mrp && product.mrp > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.mrp)}
            </span>
          )}
        </div>
        {perUnitPrice && (
          <p className="text-[10px] text-gray-400">{perUnitPrice}</p>
        )}
      </div>

      {/* Add button */}
      <div className="mt-2">
        {stock === "out_of_stock" ? (
          <div className="w-full h-9 flex items-center justify-center text-xs font-medium text-gray-400 border border-gray-200 rounded-lg">
            Out of stock
          </div>
        ) : cartItem ? (
          <div className="flex items-center justify-between bg-green-50 rounded-lg px-2 h-9 border border-green-200">
            <button
              onClick={() => handleQtyChange(-1)}
              className="w-7 h-7 flex items-center justify-center text-green-700"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-gray-900">{cartItem.quantity}</span>
            <button
              onClick={() => handleQtyChange(1)}
              className="w-7 h-7 flex items-center justify-center text-green-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="w-full h-9 flex items-center justify-center text-sm font-bold text-green-700 border-2 border-green-600 rounded-lg hover:bg-green-50 transition-colors"
          >
            ADD
          </button>
        )}
      </div>
    </div>
  );
}

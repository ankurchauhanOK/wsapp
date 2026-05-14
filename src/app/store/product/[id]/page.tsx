"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore, useFavoritesStore } from "@/lib/store";
import { formatPrice, stockStatus } from "@/lib/utils";
import { WEIGHT_PRESETS } from "@/lib/constants";
import { Heart, Minus, Plus, ShoppingCart, ArrowLeft } from "lucide-react";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightQty, setWeightQty] = useState(0.5);
  const { addItem, items, updateQuantity } = useCartStore();
  const { isFavorite, toggle } = useFavoritesStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        setProduct(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StoreHeader showBack onBack={() => router.back()} />
        <div className="max-w-lg mx-auto p-4 animate-pulse space-y-4">
          <div className="h-64 bg-gray-100 rounded-xl" />
          <div className="h-6 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/3" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StoreHeader showBack onBack={() => router.back()} />
        <div className="max-w-lg mx-auto p-4 text-center py-12 text-gray-400">
          Product not found
        </div>
      </div>
    );
  }

  const cartItem = items.find((i) => i.product.id === product.id);
  const stock = stockStatus(product.stock, product.low_stock_threshold);
  const fav = isFavorite(product.id);

  const handleAddToCart = () => {
    if (product.type === "weight") {
      addItem(product, weightQty);
    } else {
      addItem(product);
    }
  };

  const handleQtyChange = (delta: number) => {
    if (cartItem) {
      updateQuantity(product.id, cartItem.quantity + delta);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader showBack onBack={() => router.back()} />

      <div className="max-w-lg mx-auto">
        {/* Product Image */}
        <div className="bg-white h-64 flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="h-full object-contain"
            />
          ) : (
            <span className="text-6xl">🛒</span>
          )}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold">{product.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {product.category?.name || "General"}
              </p>
            </div>
            <button
              onClick={() => toggle(product.id)}
              className="p-2"
            >
              <Heart
                className={`h-6 w-6 ${
                  fav ? "fill-red-500 text-red-500" : "text-gray-300"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-700">
              {formatPrice(product.price)}
            </span>
            <span className="text-sm text-gray-400">
              / {product.unit_type}
            </span>
            {stock === "low_stock" && (
              <Badge variant="warning">Only {product.stock} left</Badge>
            )}
            {stock === "out_of_stock" && (
              <Badge variant="destructive">Out of stock</Badge>
            )}
          </div>

          {stock !== "out_of_stock" && (
            <>
              {product.type === "weight" && (
                <div>
                  <p className="text-sm font-medium mb-2">Select quantity</p>
                  <div className="flex flex-wrap gap-2">
                    {WEIGHT_PRESETS.map((w) => (
                      <button
                        key={w}
                        onClick={() => setWeightQty(w)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          weightQty === w
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-green-300"
                        }`}
                      >
                        {w >= 1 ? `${w} kg` : `${w * 1000}g`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {cartItem ? (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleQtyChange(-1)}
                    className="h-12 w-12"
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">
                    {cartItem.quantity}
                    {product.type === "weight" ? " kg" : ""}
                  </span>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => handleQtyChange(1)}
                    className="h-12 w-12"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart -{" "}
                  {formatPrice(
                    product.price * (product.type === "weight" ? weightQty : 1)
                  )}
                </Button>
              )}
            </>
          )}

          {product.notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">{product.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

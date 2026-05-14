"use client";

import { useState, useEffect } from "react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { ProductCard } from "@/components/store/ProductCard";
import { useFavoritesStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export default function FavoritesPage() {
  const router = useRouter();
  const { favoriteIds } = useFavoritesStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (favoriteIds.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/products?ids=${favoriteIds.join(",")}`);
        const data = await res.json();
        setProducts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [favoriteIds]);

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader showBack onBack={() => router.back()} title="Favorites" />
      <div className="max-w-lg mx-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex gap-3 animate-pulse">
                <div className="w-20 h-20 bg-gray-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Heart className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">No favorites yet</p>
            <p className="text-sm mt-1">
              Tap the heart icon on products to save them here
            </p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push("/store")}
            >
              Browse Products
            </Button>
          </div>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}

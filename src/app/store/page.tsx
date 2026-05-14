"use client";

import { useState, useEffect, useCallback } from "react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { SearchBar } from "@/components/store/SearchBar";
import { CategoryNav } from "@/components/store/CategoryNav";
import { ProductCard } from "@/components/store/ProductCard";
import { Button } from "@/components/ui/button";
import { WhatsappLogo } from "@/components/WhatsappLogo";
import type { Product, Category } from "@/types";
import { useCartStore } from "@/lib/store";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import Link from "next/link";

export function StorefrontPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const itemCount = useCartStore((s) => s.itemCount());

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (search) params.set("search", search);

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/products?${params}`),
        fetch("/api/categories"),
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setCategories(categoriesData);
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader />

      {/* WhatsApp Entry */}
      <div className="bg-green-700 text-white px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WhatsappLogo className="h-6 w-6" />
            <div>
              <p className="text-sm font-medium">Order via WhatsApp</p>
              <p className="text-xs text-green-200">
                Tap to start chatting
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20I%20want%20to%20browse%20your%20store`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-green-700 hover:bg-green-50"
            >
              Chat Now
            </Button>
          </a>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Search */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Categories */}
        {!search && (
          <CategoryNav
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}

        {/* Products */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">
              {search
                ? `Search results (${products.length})`
                : selectedCategory
                  ? "Products"
                  : "All Products"}
            </h2>
            {products.length > 0 && (
              <span className="text-xs text-gray-400">
                {products.length} items
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3 flex gap-3 animate-pulse"
                >
                  <div className="w-20 h-20 bg-gray-100 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-5 bg-gray-100 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg mb-1">No products found</p>
              <p className="text-sm">Try a different search or category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
          <Link href="/store/cart">
            <Button className="w-full h-12 shadow-lg text-base font-semibold">
              <span>View Cart ({itemCount} items)</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default StorefrontPage;

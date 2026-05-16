"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoreHero } from "@/components/store/StoreHero";
import { SearchBar } from "@/components/store/SearchBar";
import { FrequentlyBought } from "@/components/store/FrequentlyBought";
import { ProductCard } from "@/components/store/ProductCard";
import { BottomNav } from "@/components/store/BottomNav";
import { useCartStore } from "@/lib/store";
import { getMockCategories, getMockProducts, getFrequentlyBought } from "@/lib/mock-data";
import type { Category, Product } from "@/types";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";

const FEATURED_BANNERS = [
  {
    id: "b1",
    title: "Newly Launched",
    subtitle: "For You",
    bg: "bg-amber-100",
    textColor: "text-amber-900",
  },
  {
    id: "b2",
    title: "Healthy Bites",
    subtitle: "Featured",
    bg: "bg-green-100",
    textColor: "text-green-900",
  },
  {
    id: "b3",
    title: "Pickle Season",
    subtitle: "Featured",
    bg: "bg-orange-100",
    textColor: "text-orange-900",
  },
];

export default function StorefrontPage() {
  const router = useRouter();
  const itemCount = useCartStore((s) => s.itemCount());
  const subtotal = useCartStore((s) => s.subtotal());

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try API first, fallback to mock
    async function load() {
      try {
        const [catsRes, prodsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products?include_oos=true"),
        ]);
        if (catsRes.ok && prodsRes.ok) {
          const cats = await catsRes.json();
          const prods = await prodsRes.json();
          setCategories(cats);
          setProducts(prods);
        } else {
          throw new Error("API failed");
        }
      } catch {
        setCategories(getMockCategories());
        setProducts(getMockProducts());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Sort categories by popularity for the horizontal nav
  const sortedCategories = [...categories].sort((a, b) => {
    const scoreA = a.popularity_score ?? a.sort_order ?? 0;
    const scoreB = b.popularity_score ?? b.sort_order ?? 0;
    return scoreB - scoreA;
  });

  const filteredProducts = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero / Status */}
      <StoreHero />

      <div className="max-w-lg mx-auto px-4 space-y-5 -mt-2 relative z-10">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-card p-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder='Search "atta"'
          />
        </div>

        {/* Category Pills */}
        {!search && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3 pb-1">
              {sortedCategories.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => router.push(`/store/category/${cat.id}`)}
                  className="flex flex-col items-center gap-1.5 min-w-[64px] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-card flex items-center justify-center overflow-hidden group-active:scale-95 transition-transform">
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight max-w-[64px]">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Banners */}
        {!search && (
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-3">
              {FEATURED_BANNERS.map((banner) => (
                <button
                  key={banner.id}
                  className={cn(
                    "min-w-[140px] h-[160px] rounded-2xl p-3 flex flex-col justify-between text-left relative overflow-hidden shrink-0",
                    banner.bg
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-full w-fit">
                    {banner.subtitle}
                  </span>
                  <h3 className={cn("text-lg font-bold leading-tight", banner.textColor)}>
                    {banner.title}
                  </h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {search ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-900">
                {filteredProducts.length} results for "{search}"
              </h2>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="grid" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Frequently Bought */}
            <FrequentlyBought
              bundles={getFrequentlyBought()}
              categories={sortedCategories}
            />

            {/* Quick category grids */}
            <div className="space-y-4">
              {sortedCategories.slice(0, 4).map((cat) => {
                const catProducts = products
                  .filter((p) => p.category_id === cat.id)
                  .slice(0, 4);
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-base text-gray-900">{cat.name}</h2>
                      <button
                        onClick={() => router.push(`/store/category/${cat.id}`)}
                        className="text-xs font-semibold text-green-600"
                      >
                        See all
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {catProducts.map((product) => (
                        <ProductCard key={product.id} product={product} variant="grid" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating Cart Pill */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-lg mx-auto">
          <Link href="/store/cart">
            <div className="bg-green-700 text-white h-14 rounded-full shadow-lg flex items-center justify-between px-5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  {itemCount} item{itemCount > 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-base font-bold">{formatPrice(subtotal)}</span>
            </div>
          </Link>
        </div>
      )}

    </div>
  );
}

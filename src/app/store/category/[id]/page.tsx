"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { CategoryPanel } from "@/components/store/CategoryPanel";
import { TopFilterBar } from "@/components/store/TopFilterBar";
import { ProductCard } from "@/components/store/ProductCard";
import { BottomNav } from "@/components/store/BottomNav";
import { SearchBar } from "@/components/store/SearchBar";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import type { Product, Category, SubCategory } from "@/types";
import { getMockCategories, getMockProducts } from "@/lib/mock-data";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [categories] = useState<Category[]>(getMockCategories);
  const [products] = useState<Product[]>(getMockProducts);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("Popularity");

  const category = categories.find((c) => c.id === categoryId);
  const subcategories: SubCategory[] = category?.subcategories || [];

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((p) => p.category_id === categoryId);

    if (selectedSubcategory) {
      filtered = filtered.filter((p) => p.subcategory_id === selectedSubcategory);
    }

    if (search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedFilters.includes("Offers")) {
      filtered = filtered.filter((p) => p.mrp && p.mrp > p.price);
    }
    if (selectedFilters.includes("Organic")) {
      filtered = filtered.filter((p) => p.tags?.includes("Organic"));
    }
    if (selectedFilters.includes("No Maida")) {
      filtered = filtered.filter((p) => p.tags?.includes("No Maida"));
    }
    if (selectedFilters.includes("New arrivals")) {
      filtered = filtered.filter((p) => p.tags?.includes("New"));
    }

    switch (sortBy) {
      case "Price: Low to High":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "Newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        // Popularity: keep original or sort by sales
        break;
    }

    return filtered;
  }, [products, categoryId, selectedSubcategory, search, selectedFilters, sortBy]);

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Category not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-nav sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="font-semibold text-base text-gray-900 flex-1 truncate">
            {category.name}
          </h1>
          <button className="p-2 rounded-full hover:bg-gray-100">
            <SlidersHorizontal className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="flex h-[calc(100vh-56px-64px)]">
          {/* Left Panel */}
          <CategoryPanel
            subcategories={subcategories}
            selectedId={selectedSubcategory}
            onSelect={setSelectedSubcategory}
            categoryName={category.name}
          />

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Search */}
            <div className="p-2 sticky top-0 bg-gray-50 z-10">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder={`Search in ${category.name}`}
              />
            </div>

            {/* Top Filters */}
            <div className="px-2 pb-2">
              <TopFilterBar
                selectedFilters={selectedFilters}
                onFilterToggle={toggleFilter}
                onSortChange={setSortBy}
              />
            </div>

            {/* Product Grid */}
            <div className="px-2 pb-4">
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
          </div>
        </div>
      </div>

    </div>
  );
}

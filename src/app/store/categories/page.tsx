"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { getMockCategories } from "@/lib/mock-data";
import type { Category } from "@/types";
import { BottomNav } from "@/components/store/BottomNav";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        } else {
          throw new Error("API failed");
        }
      } catch {
        setCategories(getMockCategories());
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-nav sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="font-semibold text-base text-gray-900">All Categories</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => router.push(`/store/category/${cat.id}`)}
              className="bg-white rounded-xl p-4 shadow-card flex flex-col items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-900 text-center">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}

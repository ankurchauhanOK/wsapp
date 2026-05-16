"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import type { FrequentlyBoughtBundle, Category } from "@/types";
import { ChevronRight } from "lucide-react";

interface FrequentlyBoughtProps {
  bundles: FrequentlyBoughtBundle[];
  categories: Category[];
}

export function FrequentlyBought({ bundles, categories }: FrequentlyBoughtProps) {
  const router = useRouter();

  const handleBundleClick = (bundle: FrequentlyBoughtBundle) => {
    if (bundle.category_id) {
      router.push(`/store/category/${bundle.category_id}`);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-gray-900 text-base">Frequently bought</h2>
      <div className="grid grid-cols-2 gap-3">
        {bundles.map((bundle) => (
          <button
            key={bundle.id}
            onClick={() => handleBundleClick(bundle)}
            className="bg-white rounded-xl p-3 shadow-card text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex -space-x-2 mb-2">
              {bundle.images.slice(0, 2).map((img, idx) => (
                <div
                  key={idx}
                  className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
              {bundle.product_count > 2 && (
                <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-medium text-gray-500">
                  +{bundle.product_count - 2} more
                </div>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {bundle.name}
            </p>
          </button>
        ))}
      </div>

      {/* See all products CTA */}
      <button
        onClick={() => router.push("/store/categories")}
        className="w-full bg-white rounded-xl p-3 shadow-card flex items-center gap-3 active:scale-[0.98] transition-transform"
      >
        <div className="flex -space-x-2">
          {categories.slice(0, 3).map((cat) => (
            <div
              key={cat.id}
              className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden"
            >
              {cat.image ? (
                <img src={cat.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs">📦</span>
              )}
            </div>
          ))}
        </div>
        <span className="text-sm font-semibold text-gray-900">See all products</span>
        <ChevronRight className="h-4 w-4 text-gray-400 ml-auto" />
      </button>
    </div>
  );
}

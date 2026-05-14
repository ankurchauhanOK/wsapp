"use client";

import type { Category } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: Category[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Vegetables: "🥬",
  Fruits: "🍎",
  "Dairy & Eggs": "🥛",
  Bakery: "🍞",
  Beverages: "🥤",
  Snacks: "🍿",
  Spices: "🌶️",
  "Rice & Grains": "🍚",
  "Oils & Ghee": "🫒",
  "Personal Care": "🧴",
  Household: "🧹",
  Other: "📦",
};

export function CategoryNav({ categories, selected, onSelect }: CategoryNavProps) {
  if (!categories.length) return null;

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
      <div className="flex gap-2 pb-2">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "flex flex-col items-center gap-1 min-w-[68px] py-2 px-2 rounded-full transition-all",
            selected === null
              ? "bg-green-600 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
          )}
        >
          <span className="text-lg">🏪</span>
          <span className="text-[10px] font-semibold whitespace-nowrap">All</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id === selected ? null : cat.id)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[68px] py-2 px-2 rounded-full transition-all",
              cat.id === selected
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
            )}
          >
            <span className="text-lg">{CATEGORY_ICONS[cat.name] || "📦"}</span>
            <span className="text-[10px] font-semibold whitespace-nowrap">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

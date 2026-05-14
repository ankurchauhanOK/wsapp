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
            "flex flex-col items-center gap-1 min-w-[64px] py-2 px-1 rounded-xl transition-colors",
            selected === null
              ? "bg-green-100 text-green-700"
              : "bg-gray-50 text-gray-600"
          )}
        >
          <span className="text-lg">🏪</span>
          <span className="text-[10px] font-medium whitespace-nowrap">All</span>
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id === selected ? null : cat.id)}
            className={cn(
              "flex flex-col items-center gap-1 min-w-[64px] py-2 px-1 rounded-xl transition-colors",
              cat.id === selected
                ? "bg-green-100 text-green-700"
                : "bg-gray-50 text-gray-600"
            )}
          >
            <span className="text-lg">{CATEGORY_ICONS[cat.name] || "📦"}</span>
            <span className="text-[10px] font-medium whitespace-nowrap">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

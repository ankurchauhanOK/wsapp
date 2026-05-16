"use client";

import { cn } from "@/lib/utils";
import type { SubCategory } from "@/types";

interface CategoryPanelProps {
  subcategories: SubCategory[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  categoryName: string;
}

export function CategoryPanel({ subcategories, selectedId, onSelect, categoryName }: CategoryPanelProps) {
  return (
    <div className="w-[72px] lg:w-20 shrink-0 bg-gray-50 h-full overflow-y-auto scrollbar-hide border-r border-gray-100">
      <div className="py-2 space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex flex-col items-center gap-1 px-1 py-2 transition-all",
            selectedId === null
              ? "bg-white border-l-[3px] border-green-600"
              : "border-l-[3px] border-transparent opacity-70"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
            <span className="text-lg">🏪</span>
          </div>
          <span className="text-[9px] font-medium text-center leading-tight text-gray-700 line-clamp-2">
            All
          </span>
        </button>

        {subcategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect(sub.id === selectedId ? null : sub.id)}
            className={cn(
              "w-full flex flex-col items-center gap-1 px-1 py-2 transition-all",
              selectedId === sub.id
                ? "bg-white border-l-[3px] border-green-600"
                : "border-l-[3px] border-transparent opacity-70"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
              {sub.image ? (
                <img src={sub.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">🍽️</span>
              )}
            </div>
            <span className="text-[9px] font-medium text-center leading-tight text-gray-700 line-clamp-2">
              {sub.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

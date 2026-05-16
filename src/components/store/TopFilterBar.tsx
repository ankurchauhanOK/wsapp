"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";

const FILTERS = [
  "Brand",
  "Pack size",
  "Weight",
  "Organic",
  "New arrivals",
  "Offers",
  "No Maida",
  "Family pack",
  "Budget pack",
];

interface TopFilterBarProps {
  selectedFilters: string[];
  onFilterToggle: (filter: string) => void;
  onSortChange?: (sort: string) => void;
}

export function TopFilterBar({ selectedFilters, onFilterToggle, onSortChange }: TopFilterBarProps) {
  const [showSort, setShowSort] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        <button
          onClick={() => setShowSort(!showSort)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shrink-0 hover:bg-gray-50"
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
          <ChevronDown className="h-3 w-3" />
        </button>

        {FILTERS.map((filter) => {
          const active = selectedFilters.includes(filter);
          return (
            <button
              key={filter}
              onClick={() => onFilterToggle(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium shrink-0 border transition-all",
                active
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              )}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {showSort && (
        <div className="flex items-center gap-2 text-xs text-gray-500 px-1 animate-fade-in">
          <span>Sort by:</span>
          {["Popularity", "Price: Low to High", "Price: High to Low", "Newest"].map((s) => (
            <button
              key={s}
              onClick={() => {
                onSortChange?.(s);
                setShowSort(false);
              }}
              className="text-green-600 hover:underline"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

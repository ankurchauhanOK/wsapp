"use client";

import { useStoreStatusStore } from "@/lib/store";
import { MapPin, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function StoreHero() {
  const { isOpen } = useStoreStatusStore();

  return (
    <div
      className={cn(
        "relative overflow-hidden px-4 pt-4 pb-5 transition-colors",
        isOpen ? "bg-green-600" : "bg-amber-400"
      )}
    >
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-lg mx-auto">
        {/* Status & Location */}
        <div className="flex items-start justify-between">
          <div>
            {!isOpen && (
              <p className="text-xs font-medium text-amber-900/80 mb-0.5">
                Please come back at 5:45 am
              </p>
            )}
            <h1
              className={cn(
                "text-2xl font-bold tracking-tight",
                isOpen ? "text-white" : "text-amber-950"
              )}
            >
              {isOpen ? "Store Open" : "Store closed"}
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className={cn("h-3 w-3", isOpen ? "text-green-100" : "text-amber-800/70")} />
              <p
                className={cn(
                  "text-xs font-medium",
                  isOpen ? "text-green-100" : "text-amber-900/80"
                )}
              >
                HOME - Ankur, F177
              </p>
              <ChevronDown className={cn("h-3 w-3", isOpen ? "text-green-100" : "text-amber-800/70")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm">🇮🇳</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm">👤</span>
            </div>
          </div>
        </div>

        {/* Delivery estimate */}
        {isOpen && (
          <div className="mt-3 flex items-center gap-1.5 text-green-100 text-xs">
            <Clock className="h-3 w-3" />
            <span>Delivery in 10-15 mins</span>
          </div>
        )}
      </div>
    </div>
  );
}

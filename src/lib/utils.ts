import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function generateBarcode(): string {
  const prefix = "WS";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + "...";
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function stockStatus(stock: number, threshold: number): "in_stock" | "low_stock" | "out_of_stock" {
  if (stock <= 0) return "out_of_stock";
  if (stock <= threshold) return "low_stock";
  return "in_stock";
}

// Weight system: store internally in grams for weight-based items
export function toGrams(quantity: number, unit: string): number {
  switch (unit) {
    case "kg": return quantity * 1000;
    case "g": return quantity;
    case "l": return quantity * 1000;
    case "ml": return quantity;
    default: return quantity;
  }
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    const kg = grams / 1000;
    return kg % 1 === 0 ? `${kg} kg` : `${kg.toFixed(2)} kg`;
  }
  return `${grams} g`;
}

export function displayUnit(unitType: string): string {
  const units: Record<string, string> = {
    piece: "pc",
    kg: "kg",
    g: "g",
    l: "L",
    ml: "ml",
    dozen: "dozen",
    pack: "pack",
  };
  return units[unitType] || unitType;
}

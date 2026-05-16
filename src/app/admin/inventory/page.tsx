"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatPrice, stockStatus, formatDate } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  Clock,
  ChevronRight,
  Barcode,
  Filter,
  History,
  ArrowUpDown,
} from "lucide-react";
import type { Product, Category, InventoryTransaction } from "@/types";
import { getMockCategories, getMockProducts } from "@/lib/mock-data";

interface InventoryStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  expiringSoon: number;
  todayMovements: number;
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"name" | "stock" | "sales">("name");
  const [showHistory, setShowHistory] = useState(false);
  const [quickEditProduct, setQuickEditProduct] = useState<Product | null>(null);
  const [quickQty, setQuickQty] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [catsRes, prodsRes, txsRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products?include_oos=true"),
          fetch("/api/transactions?limit=20"),
        ]);

        if (catsRes.ok && prodsRes.ok) {
          const cats = await catsRes.json();
          const prods = await prodsRes.json();
          setCategories(cats);
          setProducts(prods);
        } else {
          throw new Error("API failed");
        }

        if (txsRes.ok) {
          const txs = await txsRes.json();
          setTransactions(Array.isArray(txs) ? txs : []);
        }
      } catch {
        const mockCats = getMockCategories();
        const mockProds = getMockProducts();
        setCategories(mockCats);
        setProducts(mockProds);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats: InventoryStats = useMemo(() => {
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= p.low_stock_threshold).length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    const expiringSoon = products.filter((p) => {
      if (!p.expiry_date) return false;
      const days = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 7 && days >= 0;
    }).length;
    const todayMovements = transactions.filter((t) => {
      const txDate = new Date(t.created_at).toDateString();
      return txDate === new Date().toDateString();
    }).length;

    return {
      totalProducts: products.length,
      lowStock,
      outOfStock,
      expiringSoon,
      todayMovements,
    };
  }, [products, transactions]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_id === selectedCategory);
    }

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.barcode?.includes(search) ||
          p.internal_code?.includes(search) ||
          p.brand?.toLowerCase().includes(search.toLowerCase())
      );
    }

    switch (sortBy) {
      case "stock":
        filtered.sort((a, b) => a.stock - b.stock);
        break;
      case "sales":
        // Would use sales count in real app
        filtered.sort((a, b) => (b.popularity_score || 0) - (a.popularity_score || 0));
        break;
      default:
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [products, selectedCategory, search, sortBy]);

  const handleQuickStockUpdate = async (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    try {
      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
      );

      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity_change: delta,
          reason: delta > 0 ? "stock_in" : "stock_out",
          source: "manual_edit",
        }),
      });

      toast({
        title: `${product.name} updated`,
        description: `Stock ${delta > 0 ? "added" : "removed"}: ${Math.abs(delta)}`,
        variant: "success",
      });
    } catch {
      toast({ title: "Failed to update stock", variant: "error" });
      // Revert
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: product.stock } : p))
      );
    }
  };

  const handleCustomStockUpdate = async () => {
    if (!quickEditProduct || !quickQty) return;
    const delta = parseInt(quickQty);
    if (isNaN(delta)) return;

    await handleQuickStockUpdate(quickEditProduct, delta);
    setQuickEditProduct(null);
    setQuickQty("");
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500">Manage stock by class and subclass</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => router.push("/admin/scanner/inventory")}
          >
            <Barcode className="h-4 w-4" /> Scan
          </Button>
          <Button
            size="sm"
            className="gap-1"
            onClick={() => router.push("/admin/products/new")}
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-card">
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Total Items</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-card">
          <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Low Stock</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-card">
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Out of Stock</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-card">
          <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Expiring Soon</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-card">
          <p className="text-2xl font-bold text-green-600">{stats.todayMovements}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Movements Today</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-2 pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === null
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            All Classes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(cat.id === selectedCategory ? null : cat.id)
              }
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                cat.id === selectedCategory
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, barcode, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["name", "stock", "sales"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-all ${
                sortBy === s
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {s === "sales" ? "Popularity" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-900">No products found</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const stock = stockStatus(product.stock, product.low_stock_threshold);
            const isExpiring =
              product.expiry_date &&
              Math.ceil(
                (new Date(product.expiry_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              ) <= 7;

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-card p-3 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🛒</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-green-700"
                      onClick={() => router.push(`/admin/products/${product.id}`)}
                    >
                      {product.name}
                    </p>
                    {stock === "low_stock" && (
                      <Badge variant="warning" className="text-[9px] shrink-0">
                        Low
                      </Badge>
                    )}
                    {stock === "out_of_stock" && (
                      <Badge variant="destructive" className="text-[9px] shrink-0">
                        OOS
                      </Badge>
                    )}
                    {isExpiring && (
                      <Badge className="text-[9px] shrink-0 bg-orange-50 text-orange-700 border-orange-200">
                        Expiring
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {product.category?.name} {product.brand && `· ${product.brand}`}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    {product.mrp && product.mrp > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(product.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Stock Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleQuickStockUpdate(product, -1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <div
                    className="w-10 h-8 flex items-center justify-center text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-50 rounded-lg"
                    onClick={() => {
                      setQuickEditProduct(product);
                      setQuickQty("");
                    }}
                  >
                    {product.stock}
                  </div>
                  <button
                    onClick={() => handleQuickStockUpdate(product, 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Edit Modal */}
      {quickEditProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm space-y-4 animate-slide-up">
            <div>
              <h3 className="font-semibold text-gray-900">{quickEditProduct.name}</h3>
              <p className="text-sm text-gray-500">
                Current stock: {quickEditProduct.stock} {quickEditProduct.unit_type}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Enter quantity"
                value={quickQty}
                onChange={(e) => setQuickQty(e.target.value)}
                autoFocus
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => {
                  const val = parseInt(quickQty || "0");
                  if (!isNaN(val)) {
                    handleQuickStockUpdate(quickEditProduct, -val);
                    setQuickEditProduct(null);
                    setQuickQty("");
                  }
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  const val = parseInt(quickQty || "0");
                  if (!isNaN(val)) {
                    handleQuickStockUpdate(quickEditProduct, val);
                    setQuickEditProduct(null);
                    setQuickQty("");
                  }
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setQuickEditProduct(null);
                setQuickQty("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

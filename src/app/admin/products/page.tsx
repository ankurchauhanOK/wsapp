"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Plus, Search, Package, MoreVertical, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadProducts();
  }, [search]);

  async function loadProducts() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    });
    loadProducts();
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Products</h1>
        <Link href="/admin/products/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3" />
          <p className="font-medium">No products yet</p>
          <Link href="/admin/products/new">
            <Button variant="outline" className="mt-4">
              Add your first product
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => router.push(`/admin/products/${product.id}`)}
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-lg">🛒</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-gray-400">
                  {product.category?.name} &middot; Stock: {product.stock} {product.unit_type}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatPrice(product.price)}</p>
                {product.stock <= product.low_stock_threshold && (
                  <Badge variant="warning" className="text-[9px]">
                    Low
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

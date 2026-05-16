"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useStoreStatusStore } from "@/lib/store";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  AlertTriangle,
  ArrowRight,
  Scan,
  Plus,
  Minus,
  Store,
  Warehouse,
  Clock,
  Barcode,
  History,
} from "lucide-react";
import Link from "next/link";
import type { Order, Product, InventoryTransaction } from "@/types";

interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  recentMovements: InventoryTransaction[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isOpen, toggle } = useStoreStatusStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error || "Failed to load stats");
        } else {
          setStats(data);
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Network error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-5xl mx-auto text-center py-16">
        <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-900">Something went wrong</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <Button
          variant="outline"
          className="mt-4 rounded-full"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">
      {/* Dark Green Feature Band Header */}
      <div className="bg-green-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-white/70 mt-0.5">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
            <Store className={`h-4 w-4 ${isOpen ? "text-green-300" : "text-amber-300"}`} />
            <span className={`text-xs font-semibold ${isOpen ? "text-white" : "text-amber-200"}`}>
              {isOpen ? "Store Open" : "Store Closed"}
            </span>
            <Switch checked={isOpen} onCheckedChange={toggle} className="scale-75" />
          </div>
          <Link href="/admin/scanner/billing">
            <Button variant="white-on-green" size="sm" className="gap-2">
              <Scan className="h-4 w-4" />
              Billing
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats?.todayOrders || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Today&apos;s Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(stats?.todaySales || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Today&apos;s Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {stats?.lowStockCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Low Stock Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {stats?.outOfStockCount || 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Out of Stock</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/products/new">
          <Button variant="outline" className="w-full h-20 flex-col gap-1 rounded-xl border-gray-200">
            <Plus className="h-5 w-5" />
            <span className="text-xs font-medium">Add Product</span>
          </Button>
        </Link>
        <Link href="/admin/scanner/inventory">
          <Button variant="outline" className="w-full h-20 flex-col gap-1 rounded-xl border-gray-200">
            <Barcode className="h-5 w-5" />
            <span className="text-xs font-medium">Scan Stock</span>
          </Button>
        </Link>
        <Link href="/admin/inventory">
          <Button variant="outline" className="w-full h-20 flex-col gap-1 rounded-xl border-gray-200">
            <Warehouse className="h-5 w-5" />
            <span className="text-xs font-medium">Inventory</span>
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button variant="outline" className="w-full h-20 flex-col gap-1 rounded-xl border-gray-200">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs font-medium">Orders</span>
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm text-gray-900">Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              className="text-xs text-green-600 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentOrders?.length ? (
              <div className="space-y-1">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2.5 rounded-xl transition-colors"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div>
                      <p className="font-medium text-xs text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.created_at)} {formatTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatPrice(order.total)}</p>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "cancelled"
                            ? "destructive"
                            : "warning"
                        }
                        className="text-[9px] mt-0.5"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No orders today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm text-gray-900">Low Stock Alerts</CardTitle>
            <Link
              href="/admin/alerts"
              className="text-xs text-green-600 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts?.length ? (
              <div className="space-y-1">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2.5 rounded-xl transition-colors"
                    onClick={() => router.push(`/admin/products/${product.id}`)}
                  >
                    <span className="font-medium text-xs text-gray-900">{product.name}</span>
                    <span className="text-xs text-amber-600 font-semibold">
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                All items well stocked
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Stock Movements */}
      {stats?.recentMovements && stats.recentMovements.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm text-gray-900">Recent Stock Movements</CardTitle>
            <Link
              href="/admin/inventory"
              className="text-xs text-green-600 flex items-center gap-1 font-medium"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.recentMovements.slice(0, 5).map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    {tx.quantity_change > 0 ? (
                      <Plus className="h-3 w-3 text-green-600" />
                    ) : (
                      <Minus className="h-3 w-3 text-red-500" />
                    )}
                    <span className="text-xs text-gray-900">
                      {tx.product?.name || "Unknown Product"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs font-semibold ${
                        tx.quantity_change > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {tx.quantity_change > 0 ? "+" : ""}
                      {tx.quantity_change}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-2">
                      {formatTime(tx.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

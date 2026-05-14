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
  Store,
} from "lucide-react";
import Link from "next/link";
import type { Order, Product } from "@/types";

interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  lowStockCount: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isOpen, toggle } = useStoreStatusStore();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Store className={`h-4 w-4 ${isOpen ? "text-green-600" : "text-red-400"}`} />
            <span className={`text-xs font-medium ${isOpen ? "text-green-600" : "text-red-400"}`}>
              {isOpen ? "Open" : "Closed"}
            </span>
            <Switch checked={isOpen} onCheckedChange={toggle} className="scale-75" />
          </div>
          <Link href="/admin/scanner/billing">
            <Button className="gap-2">
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
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold">{stats?.todayOrders || 0}</p>
            <p className="text-xs text-gray-500">Today&apos;s Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold">
              {formatPrice(stats?.todaySales || 0)}
            </p>
            <p className="text-xs text-gray-500">Today&apos;s Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {stats?.lowStockCount || 0}
            </p>
            <p className="text-xs text-gray-500">Low Stock Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
            <p className="text-xs text-gray-500">Total Products</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link href="/admin/products/new">
          <Button variant="outline" className="w-full h-20 flex-col gap-1">
            <Plus className="h-5 w-5" />
            <span className="text-xs">Add Product</span>
          </Button>
        </Link>
        <Link href="/admin/scanner/inventory">
          <Button variant="outline" className="w-full h-20 flex-col gap-1">
            <Scan className="h-5 w-5" />
            <span className="text-xs">Scan Stock</span>
          </Button>
        </Link>
        <Link href="/admin/orders">
          <Button variant="outline" className="w-full h-20 flex-col gap-1">
            <ShoppingCart className="h-5 w-5" />
            <span className="text-xs">Orders</span>
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              className="text-xs text-green-600 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.recentOrders?.length ? (
              <div className="space-y-2">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <div>
                      <p className="font-medium text-xs">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(order.created_at)} {formatTime(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "cancelled"
                              ? "destructive"
                              : "warning"
                        }
                        className="text-[9px]"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No orders today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Low Stock Alerts</CardTitle>
            <Link
              href="/admin/alerts"
              className="text-xs text-green-600 flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.lowStockProducts?.length ? (
              <div className="space-y-2">
                {stats.lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg"
                    onClick={() =>
                      router.push(`/admin/products/${product.id}`)
                    }
                  >
                    <span className="font-medium text-xs">{product.name}</span>
                    <span className="text-xs text-amber-600 font-semibold">
                      {product.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                All items well stocked
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

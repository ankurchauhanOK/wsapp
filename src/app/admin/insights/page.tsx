"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { TrendingUp, ShoppingCart, Package, DollarSign } from "lucide-react";

interface Insights {
  totalOrders: number;
  totalSales: number;
  totalProducts: number;
  avgOrderValue: number;
  topProducts: { name: string; count: number; revenue: number }[];
  dailySales: { date: string; total: number; count: number }[];
  paymentStats: { method: string; count: number; total: number }[];
}

export default function InsightsPage() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/insights");
        const d = await res.json();
        setData(d);
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
      <div className="p-4 max-w-4xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold">Store Insights</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-green-600 mb-2" />
            <p className="text-2xl font-bold">
              {formatPrice(data?.totalSales || 0)}
            </p>
            <p className="text-xs text-gray-500">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <ShoppingCart className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-2xl font-bold">{data?.totalOrders || 0}</p>
            <p className="text-xs text-gray-500">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Package className="h-5 w-5 text-purple-600 mb-2" />
            <p className="text-2xl font-bold">{data?.totalProducts || 0}</p>
            <p className="text-xs text-gray-500">Products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="h-5 w-5 text-amber-600 mb-2" />
            <p className="text-2xl font-bold">
              {formatPrice(data?.avgOrderValue || 0)}
            </p>
            <p className="text-xs text-gray-500">Avg Order Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {data?.topProducts?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topProducts.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center text-[10px] font-medium text-green-700">
                      {i + 1}
                    </span>
                    <span>{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 text-xs">{p.count} sold</span>
                    <span className="ml-3 font-medium">
                      {formatPrice(p.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

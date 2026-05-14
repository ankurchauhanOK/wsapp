"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ShoppingCart, Filter } from "lucide-react";
import type { Order } from "@/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const router = useRouter();

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders?limit=100");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusVariant = (status: string) => {
    switch (status) {
      case "pending":
      case "confirmed":
        return "warning" as const;
      case "delivered":
        return "default" as const;
      case "cancelled":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Orders</h1>
        <Filter className="h-5 w-5 text-gray-400" />
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {["all", "pending", "confirmed", "preparing", "delivered", "cancelled"].map(
          (s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === s
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {statusCounts[s] > 0 && (
                <span className="ml-1 opacity-80">({statusCounts[s]})</span>
              )}
            </button>
          )
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-900">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-card p-4 space-y-3 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/admin/orders/${order.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gray-500">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <Badge variant={statusVariant(order.status)} className="text-[9px]">
                    {order.status}
                  </Badge>
                  {order.order_type === "offline" && (
                    <Badge variant="secondary" className="text-[9px]">
                      Counter
                    </Badge>
                  )}
                </div>
                <span className="font-semibold text-gray-900">{formatPrice(order.total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{order.customer_name}</span>
                <span className="text-xs text-gray-500">
                  {formatDate(order.created_at)} {formatTime(order.created_at)}
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                {order.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      className="text-xs h-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(order.id, "confirmed");
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs h-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(order.id, "cancelled");
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button
                    size="sm"
                    className="text-xs h-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(order.id, "preparing");
                    }}
                  >
                    Start Preparing
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button
                    size="sm"
                    className="text-xs h-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatus(order.id, "delivered");
                    }}
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCustomerStore } from "@/lib/store";
import { ShoppingBag, Clock } from "lucide-react";
import type { Order } from "@/types";

export default function OrdersPage() {
  const router = useRouter();
  const { customerPhone } = useCustomerStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/orders?phone=${customerPhone}`);
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerPhone]);

  const statusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
      case "preparing":
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
    <div className="min-h-screen bg-gray-50">
      <StoreHeader showBack onBack={() => router.back()} title="My Orders" />
      <div className="max-w-lg mx-auto p-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 animate-pulse space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock className="h-12 w-12 mx-auto mb-3" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm mt-1">Your orders will appear here</p>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push("/store")}
            >
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl p-4 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/store/orders?id=${order.id}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <Badge variant={statusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {order.items?.length || 0} items
                  </span>
                  <span className="font-semibold">
                    {formatPrice(order.total)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  {formatDate(order.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

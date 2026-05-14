"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { ArrowLeft, Phone, MapPin } from "lucide-react";
import type { Order } from "@/types";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  async function loadOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      const data = await res.json();
      setOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    try {
      await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast({ title: `Order ${status}`, variant: "success" });
      loadOrder();
    } catch {
      toast({ title: "Failed to update", variant: "error" });
    }
  }

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center text-gray-400">Order not found</div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-xs text-gray-400">
            {formatDate(order.created_at)} {formatTime(order.created_at)}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        <Badge
          variant={
            order.status === "delivered"
              ? "default"
              : order.status === "cancelled"
                ? "destructive"
                : "warning"
          }
          className="text-sm px-3 py-1"
        >
          {order.status}
        </Badge>
        <Badge
          variant={order.payment_status === "paid" ? "default" : "warning"}
          className="text-sm px-3 py-1"
        >
          {order.payment_status === "paid" ? "Paid" : "Unpaid"}
        </Badge>
      </div>

      {/* Customer */}
      <div className="bg-white rounded-xl p-4 space-y-2">
        <h3 className="font-semibold text-sm">Customer</h3>
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {order.customer_phone}
        </p>
        {order.customer_address && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {order.customer_address}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-sm">Items</h3>
        <div className="space-y-2">
          {(order.items || []).map((item: any) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm"
            >
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-gray-400">
                  {item.quantity} x {formatPrice(item.price)}
                </p>
              </div>
              <span className="font-semibold">{formatPrice(item.total)}</span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between font-semibold text-base">
          <span>Total</span>
          <span className="text-green-700">{formatPrice(order.total)}</span>
        </div>
      </div>

      {/* Payment Info */}
      {order.transaction_ref && (
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs text-gray-400">Transaction Ref</p>
          <p className="font-mono text-sm">{order.transaction_ref}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {order.status === "pending" && (
          <>
            <Button className="flex-1" onClick={() => updateStatus("confirmed")}>
              Confirm Order
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => updateStatus("cancelled")}
            >
              Cancel
            </Button>
          </>
        )}
        {order.status === "confirmed" && (
          <Button className="w-full" onClick={() => updateStatus("preparing")}>
            Start Preparing
          </Button>
        )}
        {order.status === "preparing" && (
          <Button className="w-full" onClick={() => updateStatus("delivered")}>
            Mark as Delivered
          </Button>
        )}
      </div>
    </div>
  );
}

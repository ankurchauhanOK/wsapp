"use client";

import { useState, useEffect } from "react";
import { Scanner } from "@/components/admin/Scanner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toaster";
import { useBillingStore, useRecentScansStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, Clock } from "lucide-react";
import type { Product } from "@/types";

export default function BillingScannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { billItems, addBillItem, updateBillQuantity, removeBillItem, clearBill } =
    useBillingStore();
  const { items: recentScans, addScan } = useRecentScansStore();
  const [submitting, setSubmitting] = useState(false);
  const [showRecent, setShowRecent] = useState(true);

  const total = billItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleProductFound = (product: Product) => {
    addBillItem(product);
    addScan(product);
    toast({
      title: `Added ${product.name}`,
      variant: "success",
    });
  };

  const handleRecentTap = (product: Product) => {
    addBillItem(product);
    toast({
      title: `Added ${product.name}`,
      variant: "success",
    });
  };

  const handleCompleteBill = async () => {
    if (billItems.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: "Walk-in Customer",
          customer_phone: "0000000000",
          total,
          items: billItems.map((item) => ({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_type: item.product.unit_type,
            price: item.product.price,
            total: item.product.price * item.quantity,
          })),
          order_type: "offline",
          payment_status: "paid",
          status: "delivered",
        }),
      });

      if (!res.ok) throw new Error("Failed to create bill");

      for (const item of billItems) {
        await fetch(`/api/products/${item.product.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stock: Math.max(0, (item.product.stock || 0) - item.quantity),
          }),
        });
      }

      const totalFormatted = formatPrice(total);
      toast({
        title: `Bill Complete: ${totalFormatted}`,
        description: `${itemCount} items sold`,
        variant: "success",
      });

      clearBill();
    } catch (e: any) {
      toast({ title: "Failed to complete bill", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-32">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Billing Scanner</h1>
          <p className="text-sm text-gray-500">
            Scan items to build a bill
          </p>
        </div>
      </div>

      <Scanner mode="billing" onProductFound={handleProductFound} />

      {/* Recent Scanned Items */}
      {recentScans.length > 0 && showRecent && billItems.length === 0 && (
        <div className="bg-white rounded-xl shadow-card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <Clock className="h-4 w-4" />
              Recent
            </div>
            <button
              onClick={() => setShowRecent(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentScans.map((p) => (
              <button
                key={p.id}
                onClick={() => handleRecentTap(p)}
                className="px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium hover:bg-green-50 hover:text-green-700 transition-colors border border-gray-100"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Current Bill */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">
            Current Bill ({itemCount} items)
          </h2>
          {billItems.length > 0 && (
            <button
              onClick={clearBill}
              className="text-xs text-red-500 flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {billItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Scan items to start billing</p>
          </div>
        ) : (
          <div className="space-y-2">
            {billItems.map((item) => (
              <div
                key={item.product.id}
                className="bg-white rounded-xl shadow-card p-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(item.product.price)} each
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      updateBillQuantity(item.product.id, item.quantity - 1)
                    }
                    className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-semibold text-gray-900">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      updateBillQuantity(item.product.id, item.quantity + 1)
                    }
                    className="h-7 w-7 rounded-full hover:bg-white hover:shadow-sm"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-sm font-semibold w-20 text-right text-gray-900">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Total & Complete */}
      {billItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Total ({itemCount} items)</span>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(total)}
              </span>
            </div>
            <Button
              className="w-full h-12 text-base font-semibold rounded-full shadow-lg"
              onClick={handleCompleteBill}
              disabled={submitting}
            >
              {submitting
                ? "Processing..."
                : `Complete Bill - ${formatPrice(total)}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

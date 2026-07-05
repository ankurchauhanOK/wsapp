"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { useBillingStore, useRecentScansStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/admin/BarcodeScanner";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Scan,
  CheckCircle2,
  Package,
} from "lucide-react";
import type { Product } from "@/types";

type ScanCard =
  | { type: "product"; product: Product; quantity: number }
  | { type: "not_found"; barcode: string }
  | null;

export default function BillingScannerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { billItems, addBillItem, updateBillQuantity, removeBillItem, clearBill } =
    useBillingStore();
  const { addScan } = useRecentScansStore();

  const [showScanner, setShowScanner] = useState(false);
  const [scanCard, setScanCard] = useState<ScanCard>(null);
  const [submitting, setSubmitting] = useState(false);

  const total = billItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const itemCount = billItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleScanResult = useCallback(
    (result: any) => {
      console.log("[Scan result]", JSON.stringify(result, null, 2));
      if (result.type === "product") {
        const product: Product = result.product;
        addBillItem(product);
        addScan(product);

        // Find current quantity in cart
        const existing = billItems.find((i) => i.product.id === product.id);
        const qty = (existing?.quantity || 0) + 1;

        setScanCard({ type: "product", product, quantity: qty });

        // Auto-dismiss after 1.5s
        setTimeout(() => setScanCard((c) => (c?.type === "product" && c.product.id === product.id ? null : c)), 1500);

        toast({
          title: `Added: ${product.name}`,
          description: `Quantity in cart: ${qty}`,
          variant: "success",
        });
      } else if (result.type === "off_found" || result.type === "not_found") {
        setScanCard({ type: "not_found", barcode: result.barcode });
        toast({
          title: "Product not found",
          description: `Barcode: ${result.barcode}`,
          variant: "error",
        });
      } else if (result.type === "error") {
        toast({
          title: "Scan failed",
          description: result.message || "Could not look up product",
          variant: "error",
        });
      }
    },
    [addBillItem, addScan, billItems, toast]
  );

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

      toast({
        title: `Bill Complete: ${formatPrice(total)}`,
        description: `${itemCount} items sold`,
        variant: "success",
      });

      clearBill();
    } catch {
      toast({ title: "Failed to complete bill", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-nav sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-base text-gray-900">Billing Scanner</h1>
            <p className="text-xs text-gray-500">Scan items to build a bill</p>
          </div>
          {billItems.length > 0 && (
            <button
              onClick={clearBill}
              className="text-xs text-red-500 flex items-center gap-1 font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full p-4 space-y-4">
        {/* Scan Button */}
        <button
          onClick={() => setShowScanner(true)}
          className="w-full h-20 bg-green-600 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg active:scale-[0.98] transition-transform"
        >
          <Scan className="h-7 w-7" />
          <div className="text-left">
            <p className="font-bold text-lg leading-tight">Scan Barcode</p>
            <p className="text-xs text-green-100">Tap to open camera</p>
          </div>
        </button>

        {/* Scan Success Card */}
        {scanCard?.type === "product" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800 truncate">
                {scanCard.product.name}
              </p>
              <p className="text-xs text-green-600">
                Added · Qty: {scanCard.quantity}
              </p>
            </div>
            <span className="text-sm font-bold text-green-700">
              {formatPrice(scanCard.product.price)}
            </span>
          </div>
        )}

        {/* Not Found Card */}
        {scanCard?.type === "not_found" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
            <Package className="h-5 w-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800">
                Product not found
              </p>
              <p className="text-xs text-red-600 font-mono">
                {scanCard.barcode}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 border-red-300 text-red-700"
              onClick={() => router.push("/admin/products/new")}
            >
              Create
            </Button>
          </div>
        )}

        {/* Current Bill */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm text-gray-900">
            Current Bill ({itemCount} items)
          </h2>

          {billItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
                    <button
                      onClick={() =>
                        updateBillQuantity(item.product.id, item.quantity - 1)
                      }
                      className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateBillQuantity(item.product.id, item.quantity + 1)
                      }
                      className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-20 text-right text-gray-900">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom total bar */}
      {billItems.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">Total ({itemCount} items)</span>
              <span className="text-2xl font-bold text-green-600">
                {formatPrice(total)}
              </span>
            </div>
            <Button
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg"
              onClick={handleCompleteBill}
              disabled={submitting}
            >
              {submitting ? "Processing..." : `Complete Bill · ${formatPrice(total)}`}
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}

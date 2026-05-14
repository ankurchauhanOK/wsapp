"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCartStore, useCustomerStore, useStoreStatusStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import { Phone, User, MapPin, Store } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { customerName, customerPhone, customerAddress, setCustomer } =
    useCustomerStore();
  const { isOpen } = useStoreStatusStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: customerName,
    phone: customerPhone,
    address: customerAddress,
  });

  useEffect(() => {
    if (items.length === 0) {
      router.push("/store");
    }
  }, [items.length, router]);

  if (items.length === 0) return null;

  const deliveryFee = subtotal() >= 200 ? 0 : 20;
  const total = subtotal() + deliveryFee;

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast({
        title: "Please fill in your details",
        variant: "error",
      });
      return;
    }

    if (form.phone.length < 10) {
      toast({
        title: "Please enter a valid phone number",
        variant: "error",
      });
      return;
    }

    setLoading(true);
    setCustomer(form);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_phone: form.phone,
          customer_address: form.address,
          items: items.map((i) => ({
            product_id: i.product.id,
            product_name: i.product.name,
            quantity: i.quantity,
            unit_type: i.product.unit_type,
            price: i.product.price,
            total: i.product.price * i.quantity,
          })),
          total,
          order_type: "online",
        }),
      });

      const order = await res.json();

      if (!res.ok) throw new Error(order.error || "Failed to create order");

      clearCart();

      router.push(`/store/payment?order_id=${order.id}&total=${total}`);
    } catch (e: any) {
      toast({
        title: "Something went wrong",
        description: e.message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader showBack onBack={() => router.back()} title="Checkout" />

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Store Closed Banner */}
        {!isOpen && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Store className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Store is currently closed</p>
              <p className="text-xs text-amber-600">You can still place an order. We&apos;ll process it when we reopen.</p>
            </div>
          </div>
        )}

        {/* Customer Details */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">Your Details</h3>
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="pl-9"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Phone number"
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="pl-9"
                maxLength={10}
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Delivery address (optional)"
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4 space-y-3">
          <h3 className="font-semibold">Order Summary</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {item.product.name} x{item.quantity}
                </span>
                <span className="font-medium">
                  {formatPrice(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(subtotal())}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span>
              {deliveryFee === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatPrice(deliveryFee)
              )}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between font-semibold text-base">
            <span>Total</span>
            <span className="text-green-700">{formatPrice(total)}</span>
          </div>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Placing order..." : `Place Order - ${formatPrice(total)}`}
        </Button>

        <p className="text-xs text-center text-gray-400">
          By placing this order, you agree to our terms and privacy policy
        </p>
      </div>
    </div>
  );
}

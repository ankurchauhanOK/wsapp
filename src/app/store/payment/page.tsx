"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StoreHeader } from "@/components/store/StoreHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { formatPrice } from "@/lib/utils";
import { UPI_ID, SHOP_NAME } from "@/lib/constants";
import { Copy, Check, Smartphone } from "lucide-react";
import { useQRCode } from "@/hooks/useQRCode";

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const orderId = searchParams.get("order_id");
  const total = Number(searchParams.get("total")) || 0;
  const [copied, setCopied] = useState(false);
  const [transactionRef, setTransactionRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(SHOP_NAME)}&am=${total}&tn=Order%20${orderId}`;
  const qrDataUrl = useQRCode(upiUrl);

  useEffect(() => {
    if (!orderId) router.push("/store");
  }, [orderId, router]);

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "UPI ID copied!", variant: "success" });
  };

  const handleConfirmPayment = async () => {
    if (!transactionRef) {
      toast({ title: "Please enter transaction reference", variant: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: "paid",
          transaction_ref: transactionRef,
          status: "confirmed",
        }),
      });

      if (!res.ok) throw new Error("Failed to update payment");

      router.push(`/store/success?order_id=${orderId}`);
    } catch (e: any) {
      toast({ title: "Failed to confirm payment", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayLater = async () => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: "pending",
        }),
      });
      router.push(`/store/success?order_id=${orderId}`);
    } catch (e) {
      toast({ title: "Something went wrong", variant: "error" });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      <div className="bg-white rounded-xl p-6 text-center space-y-4">
        <h2 className="font-bold text-lg">Pay with UPI</h2>
        <p className="text-3xl font-bold text-green-700">
          {formatPrice(total)}
        </p>
        <div className="flex justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="UPI QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center">
              <Smartphone className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Or pay to UPI ID:</p>
          <div className="flex items-center justify-center gap-2">
            <code className="bg-gray-50 px-3 py-1.5 rounded-lg text-sm font-mono">
              {UPI_ID}
            </code>
            <Button variant="outline" size="icon-sm" onClick={handleCopy}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <a
          href={upiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full">
            <Smartphone className="h-4 w-4 mr-2" />
            Open UPI App
          </Button>
        </a>
      </div>

      <div className="bg-white rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-sm">Confirm Payment</h3>
        <Input
          placeholder="Enter UPI transaction reference (optional)"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
        />
        <Button
          className="w-full"
          onClick={handleConfirmPayment}
          disabled={submitting}
        >
          {submitting ? "Confirming..." : "I've Paid"}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-gray-500"
          onClick={handlePayLater}
        >
          Pay later at counter
        </Button>
      </div>

      <p className="text-xs text-center text-gray-400">
        Order #{orderId?.slice(0, 8)}
      </p>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <StoreHeader title="Payment" />
      <Suspense fallback={
        <div className="max-w-lg mx-auto p-4 animate-pulse space-y-4">
          <div className="h-64 bg-gray-100 rounded-xl" />
          <div className="h-10 bg-gray-100 rounded" />
        </div>
      }>
        <PaymentContent />
      </Suspense>
    </div>
  );
}

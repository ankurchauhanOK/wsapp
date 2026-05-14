"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/constants";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!orderId) router.push("/store");
  }, [orderId, router]);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/store");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  return (
    <div className="max-w-sm w-full text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Order Placed!</h1>
        <p className="text-gray-500 mt-1">
          Your order has been received successfully.
        </p>
      </div>
      <div className="bg-white rounded-xl p-4 space-y-2">
        <p className="text-sm text-gray-500">Order ID</p>
        <p className="font-mono font-medium">
          {orderId?.slice(0, 8).toUpperCase()}
        </p>
      </div>
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20I%20just%20placed%20an%20order%20(${orderId?.slice(0, 8).toUpperCase()})`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button variant="outline" className="w-full">
          Contact us on WhatsApp
        </Button>
      </a>
      <Button className="w-full" onClick={() => router.push("/store")}>
        Continue Shopping
      </Button>
      <p className="text-xs text-gray-400">
        Redirecting to store in {countdown}s
      </p>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-center text-gray-400">Loading...</div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}

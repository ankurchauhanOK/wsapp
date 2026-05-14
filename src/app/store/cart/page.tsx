"use client";

import { StoreHeader } from "@/components/store/StoreHeader";
import { CartDrawer } from "@/components/store/CartDrawer";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <StoreHeader showBack onBack={() => router.back()} />
      <div className="flex-1 max-w-lg mx-auto w-full">
        <CartDrawer />
      </div>
    </div>
  );
}

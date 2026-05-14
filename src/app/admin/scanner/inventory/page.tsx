"use client";

import { Scanner } from "@/components/admin/Scanner";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InventoryScannerPage() {
  const router = useRouter();

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Inventory Scanner</h1>
          <p className="text-sm text-gray-500">
            Scan to add or remove stock
          </p>
        </div>
      </div>

      <Scanner mode="inventory" />
    </div>
  );
}

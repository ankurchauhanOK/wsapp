"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BarcodeScanner } from "@/components/admin/BarcodeScanner";
import {
  ArrowLeft,
  Plus,
  Minus,
  Scan,
  CheckCircle2,
  Package,
  History,
  Save,
  Tag,
} from "lucide-react";
import type { Product, Category } from "@/types";

type ScanState =
  | { type: "product"; product: Product }
  | { type: "not_found"; barcode: string }
  | null;

export default function InventoryScannerPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [showScanner, setShowScanner] = useState(false);
  const [scanState, setScanState] = useState<ScanState>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [reason, setReason] = useState("stock_in");
  const [saving, setSaving] = useState(false);
  const [recentMoves, setRecentMoves] = useState<
    { product: Product; qty: number; time: string }[]
  >([]);

  // Quick-add form state
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newCategoryId, setNewCategoryId] = useState("");
  const [newUnitType, setNewUnitType] = useState("piece");
  const [addingProduct, setAddingProduct] = useState(false);

  const handleScanResult = useCallback(
    (result: any) => {
      setShowScanner(false); // Close scanner overlay

      if (result.type === "product") {
        // Product exists - redirect to edit page
        toast({
          title: "Product found!",
          description: `${result.product.name} - opening edit page...`,
          variant: "success",
        });
        router.push(`/admin/products/${result.product.id}`);
      } else if (result.type === "not_found") {
        // New product - redirect to add page with barcode prefilled
        toast({
          title: "New product",
          description: `Barcode: ${result.barcode} - opening add page...`,
          variant: "info",
        });
        router.push(`/admin/products/new?barcode=${encodeURIComponent(result.barcode)}`);
      } else if (result.type === "error") {
        // Lookup failed - stay on this page, show error
        toast({
          title: "Scan failed",
          description: result.message || "Could not look up product. Try again.",
          variant: "error",
        });
      }
    },
    [toast, router]
  );

  // Fetch categories when showing "not found" so user can pick a category
  useEffect(() => {
    if (scanState?.type === "not_found" && categories.length === 0) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setCategories(data);
        })
        .catch(() => {
          // ignore
        });
    }
  }, [scanState, categories.length]);

  const handleAddProduct = async () => {
    if (!newName.trim() || !newPrice.trim() || !scanState || scanState.type !== "not_found") {
      toast({ title: "Name and price are required", variant: "error" });
      return;
    }
    setAddingProduct(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          price: Number(newPrice),
          stock: Number(newStock) || 0,
          barcode: scanState.barcode,
          category_id: newCategoryId || undefined,
          unit_type: newUnitType,
          type: newUnitType === "piece" || newUnitType === "dozen" || newUnitType === "pack" ? "piece" : "weight",
        }),
      });
      if (!res.ok) throw new Error("Failed to create product");
      const product: Product = await res.json();
      toast({ title: `${product.name} created`, variant: "success" });
      // Immediately switch to product edit mode
      setScanState({ type: "product", product });
      setAdjustQty(Number(newStock) || 1);
      setReason("stock_in");
      // Reset form
      setNewName("");
      setNewPrice("");
      setNewStock("0");
      setNewCategoryId("");
      setNewUnitType("piece");
    } catch {
      toast({ title: "Failed to create product", variant: "error" });
    } finally {
      setAddingProduct(false);
    }
  };

  const handleSave = async () => {
    if (scanState?.type !== "product" || adjustQty === 0) return;

    const product = scanState.product;
    const delta = reason === "stock_out" || reason === "damage" ? -adjustQty : adjustQty;
    const newStock = Math.max(0, product.stock + delta);

    setSaving(true);
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity_change: delta,
          reason,
          source: "inventory_scanner",
        }),
      });

      setRecentMoves((prev) => [
        { product, qty: delta, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) },
        ...prev.slice(0, 9),
      ]);

      toast({
        title: `${product.name} updated`,
        description: `Stock ${delta > 0 ? "added" : "removed"}: ${Math.abs(delta)}`,
        variant: "success",
      });

      setScanState(null);
      setAdjustQty(1);
    } catch {
      toast({ title: "Failed to update stock", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const product = scanState?.type === "product" ? scanState.product : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-nav sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-base text-gray-900">Inventory Scanner</h1>
            <p className="text-xs text-gray-500">Scan to update stock</p>
          </div>
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

        {/* Product Edit Drawer */}
        {product && (
          <div className="bg-white rounded-2xl shadow-card p-4 space-y-4 animate-slide-up">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  {product.category?.name} · Current stock: {product.stock} {product.unit_type}
                </p>
                <p className="text-sm font-semibold text-green-600 mt-0.5">
                  {formatPrice(product.price)}
                </p>
              </div>
              <button
                onClick={() => setScanState(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Reason selector */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: "stock_in", label: "Stock In", color: "green" },
                { value: "stock_out", label: "Stock Out", color: "red" },
                { value: "manual_correction", label: "Correction", color: "amber" },
                { value: "damage", label: "Damaged", color: "red" },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    reason === r.value
                      ? r.color === "green"
                        ? "bg-green-600 text-white border-green-600"
                        : r.color === "red"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Quantity adjuster */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setAdjustQty((q) => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
              >
                <Minus className="h-5 w-5 text-gray-700" />
              </button>
              <div className="text-center w-20">
                <span className="text-3xl font-bold text-gray-900">{adjustQty}</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                  {product.unit_type}
                </p>
              </div>
              <button
                onClick={() => setAdjustQty((q) => q + 1)}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
              >
                <Plus className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[5, 10, 25, 50].map((p) => (
                <button
                  key={p}
                  onClick={() => setAdjustQty(p)}
                  className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 hover:bg-green-50 hover:text-green-700 transition-colors border border-gray-100"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Save button */}
            <Button
              className="w-full h-14 text-base font-bold rounded-xl shadow-lg"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Stock Update
                </>
              )}
            </Button>
          </div>
        )}

        {/* Quick Add Product Form */}
        {scanState?.type === "not_found" && (
          <div className="bg-white rounded-2xl shadow-card p-4 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Tag className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">New Product</p>
                <p className="text-xs text-gray-500 font-mono">{scanState.barcode}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Product name (e.g. Parle-G 200g)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-12 text-base"
                autoFocus
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Price (₹)"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="h-12 flex-1"
                />
                <Input
                  type="number"
                  placeholder="Stock"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  className="h-12 w-28"
                />
              </div>
              <div className="flex gap-2">
                <Select
                  placeholder="Category"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                  options={[
                    { value: "", label: "No category" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  className="flex-1"
                />
                <Select
                  placeholder="Unit"
                  value={newUnitType}
                  onChange={(e) => setNewUnitType(e.target.value)}
                  options={[
                    { value: "piece", label: "Piece" },
                    { value: "pack", label: "Pack" },
                    { value: "kg", label: "Kg" },
                    { value: "g", label: "Gram" },
                    { value: "l", label: "Litre" },
                    { value: "ml", label: "Ml" },
                    { value: "dozen", label: "Dozen" },
                  ]}
                  className="w-28"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 h-12 text-base font-semibold"
                onClick={handleAddProduct}
                disabled={addingProduct || !newName.trim() || !newPrice.trim()}
              >
                {addingProduct ? "Saving..." : "Add Product & Update Stock"}
              </Button>
              <Button
                variant="outline"
                className="h-12 px-4"
                onClick={() => setScanState(null)}
                disabled={addingProduct}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Recent Movements */}
        {recentMoves.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-700">
              <History className="h-4 w-4" />
              <h2 className="font-semibold text-sm">Recent Updates</h2>
            </div>
            <div className="space-y-1.5">
              {recentMoves.map((move, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {move.qty > 0 ? (
                      <Plus className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-900 truncate max-w-[180px]">
                      {move.product.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        move.qty > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {move.qty > 0 ? "+" : ""}
                      {move.qty}
                    </span>
                    <span className="text-[10px] text-gray-400">{move.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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

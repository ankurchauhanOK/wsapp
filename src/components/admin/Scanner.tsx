"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { Camera, Search, X, Package } from "lucide-react";
import type { Product } from "@/types";

interface ScannerProps {
  mode: "inventory" | "billing";
  onProductFound?: (product: Product) => void;
  onStockUpdate?: (product: Product, delta: number) => void;
}

export function Scanner({ mode, onProductFound, onStockUpdate }: ScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [qtyAdjust, setQtyAdjust] = useState(0);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showNameSearch, setShowNameSearch] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const lookupProduct = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setSearchResults([]);
    try {
      const res = await fetch(`/api/scan?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        setQtyAdjust(0);
        setManualCode("");
        onProductFound?.(data);
      } else {
        toast({ title: "Product not found by barcode/code", variant: "error" });
        // Fallback: search by name
        const searchRes = await fetch(`/api/products?search=${encodeURIComponent(code)}&include_oos=true`);
        if (searchRes.ok) {
          const results = await searchRes.json();
          if (results.length > 0) {
            setSearchResults(results);
            setShowNameSearch(true);
            toast({ title: `Found ${results.length} product(s) by name`, variant: "info" });
          }
        }
      }
    } catch {
      toast({ title: "Search failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleNameSearch = async () => {
    if (!nameQuery) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(nameQuery)}&include_oos=true`);
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
        if (results.length === 0) {
          toast({ title: "No products found", variant: "error" });
        }
      }
    } catch {
      toast({ title: "Search failed", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (p: Product) => {
    setProduct(p);
    setSearchResults([]);
    setShowNameSearch(false);
    setNameQuery("");
    setQtyAdjust(0);
    onProductFound?.(p);
  };

  const handleManualSearch = () => {
    lookupProduct(manualCode);
  };

  const startScanning = async () => {
    setScanning(true);
    try {
      const Html5Qrcode = (await import("html5-qrcode")).Html5Qrcode;
      const scanner = new Html5Qrcode("scanner-element");

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText: string) => {
          scanner.stop();
          setScanning(false);
          lookupProduct(decodedText);
        },
        () => {}
      );
    } catch (e) {
      toast({ title: "Camera access denied", variant: "error" });
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
  };

  const handleApplyStock = async (delta: number) => {
    if (!product) return;
    try {
      const newStock = (product.stock || 0) + delta;
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Math.max(0, newStock) }),
      });

      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          quantity_change: delta,
          reason: delta > 0 ? "stock_in" : "stock_out",
          source: mode === "inventory" ? "inventory_scanner" : "billing_scanner",
        }),
      });

      onStockUpdate?.(product, delta);
      setProduct((prev) =>
        prev ? { ...prev, stock: Math.max(0, newStock) } : null
      );
      setQtyAdjust(0);
      toast({
        title: delta > 0 ? `Added ${delta}` : `Removed ${Math.abs(delta)}`,
        variant: "success",
      });
    } catch {
      toast({ title: "Failed to update stock", variant: "error" });
    }
  };

  const clearProduct = () => {
    setProduct(null);
    setManualCode("");
    setQtyAdjust(0);
    setSearchResults([]);
    setShowNameSearch(false);
    setNameQuery("");
  };

  const presets = mode === "inventory" ? [1, 5, 10, 25, 50] : [1, 2, 3, 5];

  return (
    <div className="space-y-4">
      {/* Scanner */}
      <div className="bg-black rounded-xl overflow-hidden aspect-video relative">
        {scanning ? (
          <div id="scanner-element" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <Camera className="h-12 w-12 text-gray-600" />
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2">
          {scanning ? (
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={stopScanning}
            >
              <X className="h-4 w-4 mr-1" /> Stop
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={startScanning}
            >
              <Camera className="h-4 w-4 mr-1" /> Scan Barcode
            </Button>
          )}
        </div>
      </div>

      {/* Manual Entry: Barcode/Code */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Type barcode, code, or product name"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
          />
        </div>
        <Button onClick={handleManualSearch} disabled={loading || !manualCode}>
          Find
        </Button>
      </div>

      {/* Name Search Toggle */}
      {!product && searchResults.length === 0 && (
        <div className="text-center">
          <button
            onClick={() => setShowNameSearch(!showNameSearch)}
            className="text-xs text-green-600 hover:underline"
          >
            {showNameSearch ? "Hide name search" : "Search by product name instead"}
          </button>
        </div>
      )}

      {/* Name Search */}
      {showNameSearch && !product && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search product by name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="pl-9"
              onKeyDown={(e) => e.key === "Enter" && handleNameSearch()}
              autoFocus
            />
          </div>
          <Button onClick={handleNameSearch} disabled={loading || !nameQuery}>
            Search
          </Button>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !product && (
        <div className="bg-white rounded-xl p-3 space-y-1 animate-fade-in">
          <p className="text-xs text-gray-400 font-medium mb-2">
            Select a product:
          </p>
          {searchResults.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProduct(p)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-left"
            >
              <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center shrink-0">
                <span className="text-sm">🛒</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-gray-400">
                  Stock: {p.stock} &middot; ₹{p.price}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Product Result */}
      {product && (
        <div className="bg-white rounded-xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <p className="text-xs text-gray-400">
                {product.category?.name} &middot; Stock: {product.stock} {product.unit_type}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={clearProduct}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {mode === "inventory" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Adjust Stock</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyStock(p)}
                  >
                    +{p}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleApplyStock(-p)}
                  >
                    -{p}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Custom qty"
                  value={qtyAdjust || ""}
                  onChange={(e) => setQtyAdjust(Number(e.target.value))}
                  className="flex-1"
                />
                <Button
                  variant="default"
                  size="sm"
                  disabled={!qtyAdjust}
                  onClick={() => handleApplyStock(qtyAdjust)}
                >
                  Add
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!qtyAdjust}
                  onClick={() => handleApplyStock(-qtyAdjust)}
                >
                  Remove
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Current stock: {product.stock}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyStock(-p)}
                  >
                    Bill {p}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Qty to bill"
                  value={qtyAdjust || ""}
                  onChange={(e) => setQtyAdjust(Number(e.target.value))}
                  className="flex-1"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={!qtyAdjust}
                  onClick={() => handleApplyStock(-qtyAdjust)}
                >
                  Bill
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Scanning deducts stock immediately for billing
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

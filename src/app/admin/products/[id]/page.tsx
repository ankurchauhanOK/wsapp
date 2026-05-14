"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toaster";
import { formatPrice, generateBarcode, formatDate, formatTime } from "@/lib/utils";
import { ArrowLeft, Trash2, Download, Barcode, Plus, Minus, History } from "lucide-react";
import { useQRCode } from "@/hooks/useQRCode";
import type { Product, Category, InventoryTransaction } from "@/types";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    type: "piece" as "piece" | "weight",
    unit_type: "piece" as string,
    price: "",
    stock: "",
    low_stock_threshold: "10",
    barcode: "",
    internal_code: "",
    notes: "",
    active: true,
  });

  const [stockHistory, setStockHistory] = useState<InventoryTransaction[]>([]);
  const qrDataUrl = useQRCode(form.internal_code);

  useEffect(() => {
    async function load() {
      try {
        const [productRes, categoriesRes, historyRes] = await Promise.all([
          fetch(`/api/products/${params.id}`),
          fetch("/api/categories"),
          fetch(`/api/products/${params.id}/history`),
        ]);
        const product = await productRes.json();
        const cats = await categoriesRes.json();
        const history = await historyRes.json();
        setCategories(cats);
        setStockHistory(Array.isArray(history) ? history : []);

        setForm({
          name: product.name || "",
          category_id: product.category_id || "",
          type: product.type || "piece",
          unit_type: product.unit_type || "piece",
          price: String(product.price || ""),
          stock: String(product.stock || "0"),
          low_stock_threshold: String(product.low_stock_threshold || "10"),
          barcode: product.barcode || "",
          internal_code: product.internal_code || generateBarcode(),
          notes: product.notes || "",
          active: product.active ?? true,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({ title: "Name and price are required", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category_id: form.category_id,
          type: form.type,
          unit_type: form.unit_type,
          price: Number(form.price),
          stock: Number(form.stock),
          low_stock_threshold: Number(form.low_stock_threshold),
          barcode: form.barcode || null,
          internal_code: form.internal_code,
          notes: form.notes || null,
          active: form.active,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast({ title: "Product updated!", variant: "success" });
      router.push("/admin/products");
    } catch (e: any) {
      toast({ title: e.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this product?")) return;
    try {
      await fetch(`/api/products/${params.id}`, { method: "DELETE" });
      toast({ title: "Product deleted", variant: "success" });
      router.push("/admin/products");
    } catch {
      toast({ title: "Failed to delete", variant: "error" });
    }
  };

  const handlePrintLabel = () => {
    if (!qrDataUrl) return;
    const win = window.open("");
    if (win) {
      win.document.write(`
        <html><body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0">
        <div style="text-align:center">
          <img src="${qrDataUrl}" style="width:200px;height:200px"/>
          <p style="font-family:sans-serif;margin-top:8px;font-size:14px">${form.name}</p>
          <p style="font-family:monospace;font-size:12px;color:#666">${form.internal_code}</p>
        </div>
        </body></html>
      `);
      win.print();
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-100 rounded w-1/3" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Edit Product</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      {/* QR Code Label */}
      <div className="bg-white rounded-xl p-4 flex items-center gap-4">
        <div className="w-20 h-20 bg-white border rounded-lg flex items-center justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR" className="w-16 h-16" />
          ) : (
            <Barcode className="h-8 w-8 text-gray-300" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Internal QR Code</p>
          <p className="text-xs text-gray-400 font-mono">{form.internal_code}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handlePrintLabel}
          >
            <Download className="h-3 w-3 mr-1" /> Print Label
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={form.category_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, category_id: e.target.value }))
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              options={[
                { value: "piece", label: "Piece" },
                { value: "weight", label: "Weight" },
              ]}
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.target.value as "piece" | "weight" }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              options={[
                { value: "piece", label: "Piece" },
                { value: "kg", label: "Kg" },
                { value: "g", label: "Gram" },
                { value: "l", label: "Litre" },
                { value: "ml", label: "Ml" },
                { value: "dozen", label: "Dozen" },
                { value: "pack", label: "Pack" },
              ]}
              value={form.unit_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, unit_type: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Price *</Label>
            <Input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Stock</Label>
            <Input
              type="number"
              value={form.stock}
              onChange={(e) =>
                setForm((f) => ({ ...f, stock: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Low Stock Threshold</Label>
          <Input
            type="number"
            value={form.low_stock_threshold}
            onChange={(e) =>
              setForm((f) => ({ ...f, low_stock_threshold: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Barcode</Label>
          <Input
            value={form.barcode}
            onChange={(e) =>
              setForm((f) => ({ ...f, barcode: e.target.value }))
            }
            placeholder="External barcode"
          />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Active</Label>
          <Switch
            checked={form.active}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, active: checked }))
            }
          />
        </div>

        <Button type="submit" className="w-full h-12" disabled={saving}>
          {saving ? "Saving..." : "Update Product"}
        </Button>
      </form>

      {/* Stock Movement History */}
      {stockHistory.length > 0 && (
        <div className="bg-white rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-sm">Stock Movement History</h3>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {stockHistory.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {tx.quantity_change > 0 ? (
                    <Plus className="h-3 w-3 text-green-600" />
                  ) : (
                    <Minus className="h-3 w-3 text-red-500" />
                  )}
                  <span>
                    <span
                      className={
                        tx.quantity_change > 0
                          ? "text-green-700 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {tx.quantity_change > 0 ? "+" : ""}
                      {tx.quantity_change}
                    </span>
                    <span className="text-gray-400 ml-1">({tx.source})</span>
                  </span>
                </div>
                <span className="text-gray-400">
                  {formatDate(tx.created_at)} {formatTime(tx.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

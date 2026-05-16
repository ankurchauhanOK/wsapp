"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toaster";
import { generateBarcode } from "@/lib/utils";
import { ArrowLeft, Barcode } from "lucide-react";
import type { Category } from "@/types";

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  // Pre-fill barcode from scanner redirect
  const prefillBarcode = searchParams.get("barcode") || "";

  const [form, setForm] = useState({
    name: "",
    category_id: "",
    type: "piece" as "piece" | "weight",
    unit_type: "piece" as string,
    price: "",
    stock: "",
    low_stock_threshold: "10",
    barcode: prefillBarcode,
    internal_code: generateBarcode(),
    notes: "",
    active: true,
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      toast({ title: "Name and price are required", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category_id: form.category_id || categories[0]?.id,
          type: form.type,
          unit_type: form.unit_type,
          price: Number(form.price),
          stock: Number(form.stock) || 0,
          low_stock_threshold: Number(form.low_stock_threshold) || 10,
          barcode: form.barcode || null,
          internal_code: form.internal_code,
          notes: form.notes || null,
          active: form.active,
        }),
      });

      if (!res.ok) throw new Error("Failed to create product");

      toast({ title: "Product created!", variant: "success" });
      router.push("/admin/products");
    } catch (e: any) {
      toast({ title: e.message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Add Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input
            placeholder="e.g. Fresh Tomatoes"
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
            placeholder="Select category"
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
              placeholder="99"
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
              placeholder="50"
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
              setForm((f) => ({
                ...f,
                low_stock_threshold: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Barcode (optional)</Label>
          <Input
            placeholder="Scan or enter barcode"
            value={form.barcode}
            onChange={(e) =>
              setForm((f) => ({ ...f, barcode: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Internal Code</Label>
          <div className="flex gap-2">
            <Input value={form.internal_code} read-only />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setForm((f) => ({ ...f, internal_code: generateBarcode() }))
              }
            >
              <Barcode className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-gray-400">
            Auto-generated internal QR code for products without barcode
          </p>
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Input
            placeholder="Any additional info"
            value={form.notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, notes: e.target.value }))
            }
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
          {saving ? "Saving..." : "Save Product"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toaster";
import { useQRCode } from "@/hooks/useQRCode";
import { SHOP_NAME, SHOP_PHONE, SHOP_ADDRESS, UPI_ID, WHATSAPP_NUMBER } from "@/lib/constants";
import { Smartphone, Copy, Check, Download, Share2 } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    shopName: SHOP_NAME,
    shopPhone: SHOP_PHONE,
    shopAddress: SHOP_ADDRESS,
    upiId: UPI_ID,
    whatsappNumber: WHATSAPP_NUMBER,
    lowStockThreshold: 10,
    autoConfirmPayment: true,
  });

  const upiUrl = `upi://pay?pa=${form.upiId}&pn=${encodeURIComponent(form.shopName)}&am=1&tn=Test`;
  const qrDataUrl = useQRCode(upiUrl);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(form.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "UPI ID copied!", variant: "success" });
  };

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Settings are currently stored locally for demo",
      variant: "success",
    });
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-12">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Shop Details */}
      <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm text-gray-900">Shop Details</h2>
        <div className="space-y-3">
          <div>
            <Label>Shop Name</Label>
            <Input
              value={form.shopName}
              onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={form.shopPhone}
              onChange={(e) => setForm((f) => ({ ...f, shopPhone: e.target.value }))}
            />
          </div>
          <div>
            <Label>Address</Label>
            <Input
              value={form.shopAddress}
              onChange={(e) => setForm((f) => ({ ...f, shopAddress: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* UPI Payment */}
      <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm text-gray-900">UPI Payment</h2>
        <div>
          <Label>UPI ID</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={form.upiId}
              onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
            />
            <Button variant="outline" size="icon" onClick={handleCopyUpi}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="UPI QR" className="w-32 h-32" />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
        <p className="text-xs text-center text-gray-400">Test QR for {form.upiId}</p>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm text-gray-900">WhatsApp</h2>
        <div>
          <Label>WhatsApp Number</Label>
          <Input
            value={form.whatsappNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, whatsappNumber: e.target.value }))
            }
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Full number with country code, no + sign
          </p>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm text-gray-900">Preferences</h2>
        <div>
          <Label>Low Stock Threshold</Label>
          <Input
            type="number"
            value={form.lowStockThreshold}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                lowStockThreshold: Number(e.target.value),
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-confirm Payment</Label>
            <p className="text-xs text-gray-400">
              Mark orders as paid when payment reference is provided
            </p>
          </div>
          <Switch
            checked={form.autoConfirmPayment}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, autoConfirmPayment: checked }))
            }
          />
        </div>
      </div>

      {/* Install App */}
      <div className="bg-white rounded-xl shadow-card p-4 space-y-3">
        <h2 className="font-semibold text-sm text-gray-900">App</h2>
        <InstallAppRow />
      </div>

      <Separator />

      <Button className="w-full h-12 rounded-full shadow-lg" onClick={handleSave}>
        Save Settings
      </Button>

      <div className="text-center space-y-2">
        <p className="text-xs text-gray-400">Kiranax v0.1.0</p>
        <p className="text-xs text-gray-400">
          WhatsApp-First Grocery Commerce System
        </p>
      </div>
    </div>
  );
}

function InstallAppRow() {
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Download className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Install Kiranax</p>
            <p className="text-xs text-gray-500">Add to home screen</p>
          </div>
        </div>
        {isIOS ? (
          <button
            onClick={() => setShowIOSHelp((s) => !s)}
            className="text-sm font-semibold text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            {showIOSHelp ? "Hide" : "How to install"}
          </button>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="text-sm font-semibold text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
          >
            Install
          </button>
        ) : (
          <span className="text-xs text-gray-400">Open in Chrome</span>
        )}
      </div>
      {isIOS && showIOSHelp && (
        <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Share2 className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold text-amber-800">Step 1: Tap the share button in Safari</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none text-amber-600">+</span>
            <span className="text-xs font-semibold text-amber-800">Step 2: Scroll down and tap "Add to Home Screen"</span>
          </div>
        </div>
      )}
    </div>
  );
}

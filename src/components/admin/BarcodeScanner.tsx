"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { X, Keyboard, Camera, ScanLine, Loader2, CheckCircle, Bug, Save } from "lucide-react";
import type { Product, Category } from "@/types";

type ScanResult =
  | { type: "product"; product: Product }
  | { type: "off_found"; barcode: string; name: string; image_url?: string; category?: string; brands?: string }
  | { type: "not_found"; barcode: string }
  | { type: "error"; message: string };

type ScanPhase = "choose" | "camera_loading" | "camera_active" | "camera_error" | "searching" | "found" | "off_found" | "not_found" | "saving";

interface BarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  onClose?: () => void;
}

const SCANNER_CONTAINER_ID = "html5-qrcode-scanner";

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [phase, setPhase] = useState<ScanPhase>("choose");
  const [errorMsg, setErrorMsg] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [lastBarcode, setLastBarcode] = useState("");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [offData, setOffData] = useState<{ name: string; image_url?: string; category?: string; brands?: string } | null>(null);

  // Add-product form state
  const [categories, setCategories] = useState<Category[]>([]);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("0");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formUnitType, setFormUnitType] = useState("piece");
  const [formSaving, setFormSaving] = useState(false);

  const scannerRef = useRef<any>(null);
  const lastBarcodeRef = useRef<string>("");
  const lastScanAtRef = useRef<number>(0);
  const isSearchingRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Fetch categories when form is visible
  useEffect(() => {
    if (phase === "off_found" || phase === "not_found") {
      if (categories.length === 0) {
        fetch("/api/categories")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) setCategories(data);
          })
          .catch(() => {});
      }
    }
  }, [phase, categories.length]);

  const log = useCallback((msg: string) => {
    console.log(`[Scanner] ${msg}`);
    setDebugInfo((prev) => [msg, ...prev].slice(0, 20));
  }, []);

  const playBeep = useCallback(() => {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 1800;
      gain.gain.value = 0.25;
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // ignore
    }
  }, []);

  const vibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
  }, []);

  const lookupProduct = useCallback(
    async (barcode: string): Promise<ScanResult> => {
      try {
        log(`API lookup: ${barcode}`);
        const res = await fetch(`/api/scan?code=${encodeURIComponent(barcode)}`);
        if (res.ok) {
          const data = await res.json();
          const product: Product = data.product || data;
          log(`Found product: ${product.name}`);
          return { type: "product", product };
        }
        if (res.status === 404) {
          const body = await res.json();
          if (body.openfoodfacts) {
            log(`OpenFoodFacts found: ${body.openfoodfacts.name}`);
            return { type: "off_found", ...body.openfoodfacts };
          }
          log(`Not found: ${barcode}`);
          return { type: "not_found", barcode };
        }
        log(`Server error: ${res.status}`);
        return { type: "error", message: `Server error: ${res.status}` };
      } catch (e: any) {
        log(`Network error: ${e.message}`);
        return { type: "error", message: "Network error" };
      }
    },
    [log]
  );

  const resetForm = useCallback(() => {
    setFormName("");
    setFormPrice("");
    setFormStock("0");
    setFormCategoryId("");
    setFormUnitType("piece");
    setOffData(null);
  }, []);

  const handleCreateProduct = useCallback(async () => {
    if (!formName.trim()) {
      toast({ title: "Product name is required", variant: "error" });
      return;
    }
    setFormSaving(true);
    try {
      const body: Record<string, any> = {
        name: formName.trim(),
        price: Number(formPrice) || 0,
        stock: Number(formStock) || 0,
        barcode: lastBarcode,
        category_id: formCategoryId || undefined,
        unit_type: formUnitType,
        type: formUnitType === "piece" || formUnitType === "dozen" || formUnitType === "pack" ? "piece" : "weight",
      };
      if (offData?.image_url) body.image = offData.image_url;

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to create product");
      }
      const product: Product = await res.json();
      log(`Product created: ${product.name}`);
      setPhase("found");
      toast({ title: `${product.name} created!`, variant: "success" });
      onScan({ type: "product", product });
    } catch (e: any) {
      log(`Create error: ${e.message}`);
      toast({ title: "Failed to create product", description: e.message, variant: "error" });
    } finally {
      setFormSaving(false);
    }
  }, [formName, formPrice, formStock, formCategoryId, formUnitType, lastBarcode, offData, toast, log, onScan]);

  const handleDecodedBarcode = useCallback(
    async (barcode: string) => {
      if (
        barcode === lastBarcodeRef.current &&
        Date.now() - lastScanAtRef.current < 2000
      ) {
        log(`Debounced duplicate: ${barcode}`);
        return;
      }

      if (isSearchingRef.current) {
        log(`Already searching, ignoring: ${barcode}`);
        return;
      }

      lastBarcodeRef.current = barcode;
      lastScanAtRef.current = Date.now();
      isSearchingRef.current = true;
      setLastBarcode(barcode);

      playBeep();
      vibrate();
      log(`Decoded barcode: ${barcode}`);

      setPhase("searching");

      const result = await lookupProduct(barcode);

      isSearchingRef.current = false;

      if (result.type === "product") {
        setPhase("found");
        resetForm();
        toast({
          title: "Product found!",
          description: result.product.name,
          variant: "success",
        });
        onScan(result);
      } else if (result.type === "off_found") {
        setOffData({
          name: result.name,
          image_url: result.image_url,
          category: result.category,
          brands: result.brands,
        });
        setFormName(result.name);
        setPhase("off_found");
        toast({
          title: "Found online",
          description: result.name,
          variant: "info",
        });
      } else if (result.type === "not_found") {
        setPhase("not_found");
        resetForm();
        toast({
          title: "Product not found",
          description: `Barcode: ${barcode}`,
          variant: "info",
        });
      } else {
        setPhase("camera_active");
        toast({
          title: "Lookup failed",
          description: result.message,
          variant: "error",
        });
      }
    },
    [lookupProduct, onScan, playBeep, vibrate, toast, log, resetForm]
  );

  const stopCamera = useCallback(async () => {
    log("Stopping camera...");
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
        log("Camera stopped and cleared");
      }
    } catch (e: any) {
      log(`Stop error: ${e.message}`);
    }
  }, [log]);

  const startCamera = useCallback(async () => {
    setPhase("camera_loading");
    setErrorMsg("");
    log("Starting camera with html5-qrcode...");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const container = document.getElementById(SCANNER_CONTAINER_ID);
      if (!container) {
        throw new Error("Scanner container not found");
      }

      const cameraConfig = { facingMode: "environment" };

      const scanner = new Html5Qrcode(SCANNER_CONTAINER_ID);
      scannerRef.current = scanner;

      log("Requesting camera access...");

      await scanner.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 300, height: 120 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        (decodedText: string) => {
          log(`html5-qrcode decoded: ${decodedText}`);
          handleDecodedBarcode(decodedText);
        },
        () => {
          // Scan failure is normal — no barcode in frame
        }
      );

      setPhase("camera_active");
      log("Camera active, scanning...");
    } catch (err: any) {
      console.error("Camera start error:", err);
      log(`Camera error: ${err.message || err}`);

      // Try ZXing fallback if html5-qrcode fails
      log("Falling back to ZXing...");
      try {
        await startZXingFallback();
        return;
      } catch (fallbackErr: any) {
        log(`ZXing fallback also failed: ${fallbackErr.message}`);
      }

      let msg = err.message || "Could not start camera";
      if (err.name === "NotAllowedError" || msg.includes("Permission")) {
        msg = "Camera permission denied. Please allow camera access in Settings > Safari > Camera.";
      } else if (err.name === "NotFoundError" || msg.includes("No camera")) {
        msg = "No camera found on this device.";
      } else if (msg.includes("is not supported")) {
        msg = "Barcode scanning not supported on this browser.";
      } else if (msg.includes("already scanning")) {
        msg = "Scanner already running. Try refreshing the page.";
      }
      setErrorMsg(msg);
      setPhase("camera_error");

      toast({
        title: "Camera failed",
        description: msg,
        variant: "error",
      });
    }
  }, [handleDecodedBarcode, toast, log]);

  // ZXing fallback
  const startZXingFallback = useCallback(async () => {
    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

    // Create a hidden video element
    const video = document.createElement("video");
    video.style.position = "fixed";
    video.style.top = "0";
    video.style.left = "0";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
    video.style.zIndex = "1";
    video.setAttribute("playsinline", "true");
    video.setAttribute("muted", "true");
    video.setAttribute("autoplay", "true");
    document.body.appendChild(video);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
      BarcodeFormat.ITF, BarcodeFormat.QR_CODE,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints);
    scannerRef.current = {
      stop: async () => {
        await (reader as any).reset();
        video.remove();
      },
      clear: async () => {},
    };

    const devices = await BrowserMultiFormatReader.listVideoInputDevices();
    const backCamera = devices.find((d: any) =>
      d.label.toLowerCase().includes("back") ||
      d.label.toLowerCase().includes("rear") ||
      d.label.toLowerCase().includes("environment")
    );

    await reader.decodeFromVideoDevice(
      backCamera?.deviceId ?? undefined,
      video,
      (result: any, err: any) => {
        if (result) {
          handleDecodedBarcode(result.getText());
        }
      }
    );

    setPhase("camera_active");
    log("ZXing fallback camera active");
  }, [handleDecodedBarcode, log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleDecodedBarcode(manualCode.trim());
    setManualCode("");
  };

  // --- Helper render for add-product form ---
  const renderAddForm = (prefilledName: string) => {
    const isOff = phase === "off_found";
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isOff && offData?.image_url && (
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-800 border border-gray-700">
              <img
                src={offData.image_url}
                alt=""
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          </div>
        )}

        {isOff && offData?.brands && (
          <p className="text-center text-sm text-gray-400">{offData.brands}</p>
        )}

        <div className="bg-gray-800/50 rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Barcode</p>
          <p className="text-white text-lg font-mono font-bold mt-0.5">{lastBarcode}</p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="Product name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="h-12 text-base bg-gray-900 border-gray-700 text-white placeholder-gray-500"
            autoFocus
          />

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Price"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              className="h-12 flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
            />
            <Input
              type="number"
              placeholder="Stock"
              value={formStock}
              onChange={(e) => setFormStock(e.target.value)}
              className="h-12 w-28 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                placeholder="Category"
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                options={[
                  { value: "", label: "No category" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
                className="h-12 bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <Select
              placeholder="Unit"
              value={formUnitType}
              onChange={(e) => setFormUnitType(e.target.value)}
              options={[
                { value: "piece", label: "Piece" },
                { value: "pack", label: "Pack" },
                { value: "kg", label: "Kg" },
                { value: "g", label: "Gram" },
                { value: "l", label: "Litre" },
                { value: "ml", label: "Ml" },
                { value: "dozen", label: "Dozen" },
              ]}
              className="h-12 w-28 bg-gray-900 border-gray-700 text-white"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1 h-12 text-base font-semibold"
            onClick={handleCreateProduct}
            disabled={formSaving || !formName.trim()}
          >
            {formSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isOff ? "Save Product from OpenFoodFacts" : "Add Product"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              stopCamera();
              setPhase("choose");
              resetForm();
            }}
            className="h-12 px-4 border-gray-700 text-gray-300"
          >
            Back
          </Button>
        </div>
      </div>
    );
  };

  // --- Choose / Manual Entry screen ---
  if (phase === "choose") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col no-select">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Scan Product</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose?.();
            }}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-center space-y-2">
            <ScanLine className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-white/70 text-sm">Choose how to scan</p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => {
                setPhase("camera_loading");
                setTimeout(() => startCamera(), 100);
              }}
              className="w-full h-20 bg-green-600 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg active:scale-[0.98] transition-transform"
            >
              <Camera className="h-7 w-7" />
              <div className="text-left">
                <p className="font-bold text-lg leading-tight">Open Camera</p>
                <p className="text-xs text-green-100">Scan barcode with camera</p>
              </div>
            </button>

            <div className="bg-gray-800 rounded-2xl p-4 space-y-3 border border-gray-700">
              <p className="text-gray-400 text-xs text-center">Or type barcode manually</p>
              <input
                type="text"
                inputMode="numeric"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                placeholder="e.g. 8901207045035"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-gray-900 text-white text-lg font-mono text-center outline-none focus:ring-2 focus:ring-green-500 border border-gray-600"
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualCode.trim()}
                className="w-full h-12 text-base font-semibold"
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Search Product
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Not Found (no online data) ---
  if (phase === "not_found") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col no-select">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Product Not Found</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose?.();
            }}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3">
          <p className="text-amber-400 text-xs font-medium">
            No online data found for this barcode. Fill in the details to add it.
          </p>
        </div>

        {renderAddForm("")}
      </div>
    );
  }

  // --- OpenFoodFacts found ---
  if (phase === "off_found") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col no-select">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Found Online</h2>
          <button
            onClick={() => {
              stopCamera();
              onClose?.();
            }}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-3">
          <p className="text-green-400 text-xs font-medium">
            Product data found on OpenFoodFacts. Review and save to your database.
          </p>
        </div>

        {renderAddForm(offData?.name || "")}
      </div>
    );
  }

  // --- Camera screen ---
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col no-select">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          {phase === "camera_active" && (
            <div className="flex items-center gap-1.5 bg-green-500 px-2.5 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-semibold">Scanning</span>
            </div>
          )}
          {phase === "searching" && (
            <div className="flex items-center gap-1.5 bg-amber-500 px-2.5 py-1 rounded-full">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
              <span className="text-white text-xs font-semibold">Searching...</span>
            </div>
          )}
          {phase === "found" && (
            <div className="flex items-center gap-1.5 bg-green-500 px-2.5 py-1 rounded-full">
              <CheckCircle className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-semibold">Found</span>
            </div>
          )}
          {phase === "saving" && (
            <div className="flex items-center gap-1.5 bg-blue-500 px-2.5 py-1 rounded-full">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
              <span className="text-white text-xs font-semibold">Saving...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              stopCamera();
              setPhase("choose");
              setManualCode("");
            }}
            className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25"
            title="Type barcode"
          >
            <Keyboard className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              stopCamera();
              onClose?.();
            }}
            className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scanner container — html5-qrcode renders video here */}
      <div className="relative flex-1 overflow-hidden">
        <div
          id={SCANNER_CONTAINER_ID}
          className="w-full h-full"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Scan frame overlay */}
        {(phase === "camera_active" || phase === "searching") && (
          <>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="relative w-[85vw] max-w-[480px] h-[100px]">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                <div className="absolute left-0 right-0 h-[3px] bg-green-400 shadow-[0_0_12px_rgba(74,222,128,1)] animate-scan-line" />
              </div>
            </div>

            <div className="absolute bottom-16 left-0 right-0 text-center pointer-events-none z-10">
              <p className="text-white/80 text-base font-medium">
                {phase === "searching" ? `Searching: ${lastBarcode}...` : "Point barcode inside the box"}
              </p>
              <p className="text-white/50 text-xs mt-1">
                {phase === "searching"
                  ? "Looking up in database..."
                  : "Hold steady, auto-detecting..."}
              </p>
            </div>
          </>
        )}

        {/* Loading overlay */}
        {phase === "camera_loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
            <ScanLine className="h-16 w-16 text-green-500 animate-spin mb-4" />
            <p className="text-white text-lg font-medium">Starting camera...</p>
            <p className="text-white/50 text-sm mt-2">Please allow camera access</p>
          </div>
        )}

        {/* Found overlay (brief) */}
        {phase === "found" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <CheckCircle className="h-16 w-16 text-green-500 mb-3" />
            <p className="text-white text-lg font-semibold">Product Found</p>
            <button
              onClick={() => {
                stopCamera();
                setPhase("choose");
              }}
              className="mt-6 px-6 py-2 bg-white/10 rounded-full text-white text-sm hover:bg-white/20"
            >
              Scan Another
            </button>
          </div>
        )}

        {/* Error overlay */}
        {phase === "camera_error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-6">
            <Camera className="h-16 w-16 text-red-500 mb-4" />
            <h3 className="text-white font-semibold text-xl mb-2">Camera Error</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs text-center">{errorMsg}</p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button onClick={startCamera} className="h-12 text-base">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  stopCamera();
                  setPhase("choose");
                }}
                className="h-12 text-base border-white/20 text-white hover:bg-white/10"
              >
                <Keyboard className="h-4 w-4 mr-2" />
                Type Barcode Instead
              </Button>
            </div>
          </div>
        )}

        {/* Debug info toggle */}
        <button
          onClick={() => setDebugInfo((prev) => (prev.length > 0 ? [] : ["Debug mode"]))}
          className="absolute bottom-2 right-2 z-30 p-2 rounded-full bg-black/50 text-white/50 hover:text-white"
        >
          <Bug className="h-4 w-4" />
        </button>
        {debugInfo.length > 0 && (
          <div className="absolute bottom-10 right-2 left-2 z-30 bg-black/80 rounded-lg p-2 max-h-32 overflow-y-auto text-[10px] font-mono text-green-400">
            {debugInfo.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { X, Keyboard, Camera, ScanLine, Smartphone } from "lucide-react";
import type { Product } from "@/types";

type ScanResult =
  | { type: "product"; product: Product }
  | { type: "not_found"; barcode: string }
  | { type: "error"; message: string };

interface BarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<"choose" | "camera" | "manual">("choose");
  const [cameraStatus, setCameraStatus] = useState<"idle" | "loading" | "active" | "error">("idle");
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const lastScanTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Play beep immediately
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
      osc.frequency.value = 1500;
      gain.gain.value = 0.2;
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }, []);

  const vibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([60, 30, 60]);
    }
  }, []);

  const lookupProduct = useCallback(
    async (barcode: string) => {
      try {
        const res = await fetch(`/api/scan?code=${encodeURIComponent(barcode)}`);
        if (res.ok) {
          const product: Product = await res.json();
          return { type: "product" as const, product };
        }
        if (res.status === 404) {
          return { type: "not_found" as const, barcode };
        }
        return { type: "error" as const, message: `Server error: ${res.status}` };
      } catch {
        return { type: "error" as const, message: "Network error - check connection" };
      }
    },
    []
  );

  const handleScan = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      // Debounce: ignore same barcode within 1.5 seconds
      if (decodedText === lastScanTimeRef.current.toString() && now - lastScanTimeRef.current < 1500) {
        return;
      }
      lastScanTimeRef.current = now;

      // Immediate feedback - beep BEFORE anything else
      playBeep();
      vibrate();

      toast({
        title: "Barcode detected!",
        description: `Code: ${decodedText}`,
        variant: "success",
      });

      // Lookup product
      const result = await lookupProduct(decodedText);
      onScan(result);
      onClose?.();
    },
    [onScan, onClose, playBeep, vibrate, lookupProduct, toast]
  );

  const stopCamera = useCallback(async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
    } catch {
      // ignore
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraStatus("loading");
    setErrorMsg("");

    // Ensure container exists and has size
    const container = document.getElementById("scanner-video-container");
    if (!container) {
      setCameraStatus("error");
      setErrorMsg("Scanner container not found in DOM");
      return;
    }

    try {
      // Import library
      const mod = await import("html5-qrcode");
      const Html5Qrcode = mod.Html5Qrcode;

      if (!Html5Qrcode) {
        throw new Error("html5-qrcode library failed to load");
      }

      // Clear container
      container.innerHTML = "";

      // Create scanner
      const scanner = new Html5Qrcode("scanner-video-container");
      html5QrCodeRef.current = scanner;

      // Start with simple config
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          handleScan(decodedText);
        },
        // Error callback - ignore "QR code not found" spam
        () => {}
      );

      setCameraStatus("active");
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraStatus("error");

      let msg = err.message || "Unknown error";
      if (err.name === "NotAllowedError") {
        msg = "Camera permission denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        msg = "No camera found on this device.";
      } else if (msg.includes("requested device not found")) {
        msg = "Rear camera not available. Try manual entry.";
      }
      setErrorMsg(msg);

      toast({
        title: "Camera failed",
        description: msg,
        variant: "error",
      });
    }
  }, [handleScan, toast]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode("");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // MANUAL ENTRY MODE
  if (mode === "manual") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">Enter Barcode</h2>
          <button
            onClick={() => {
              setMode("choose");
              setManualCode("");
            }}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="text-center space-y-2">
            <Keyboard className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-white/70 text-sm">Type the barcode number printed on the product</p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="e.g. 8901207045035"
            autoFocus
            className="w-full max-w-sm px-4 py-4 rounded-xl bg-white text-gray-900 text-xl font-mono text-center outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            className="w-full max-w-sm h-14 text-lg font-bold"
          >
            Search Product
          </Button>
          <button
            onClick={() => {
              setMode("choose");
              setManualCode("");
            }}
            className="text-gray-400 text-sm"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  // CAMERA MODE
  if (mode === "camera") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            {cameraStatus === "active" && (
              <div className="flex items-center gap-1.5 bg-green-500 px-2.5 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-semibold">Scanning</span>
              </div>
            )}
            {cameraStatus === "loading" && (
              <div className="flex items-center gap-1.5 bg-amber-500 px-2.5 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-semibold">Starting...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopCamera();
                setMode("manual");
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

        {/* Main area */}
        <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
          {/* Scanner container - must have explicit dimensions */}
          <div
            id="scanner-video-container"
            ref={scannerRef}
            style={{
              width: "100%",
              height: "100%",
              minHeight: "300px",
            }}
          />

          {/* Scan overlay when active */}
          {cameraStatus === "active" && (
            <>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-[280px] h-[160px]">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                  <div className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)] animate-scan-line" />
                </div>
              </div>
              <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
                <p className="text-white/80 text-base font-medium">Point camera at barcode</p>
                <p className="text-white/50 text-xs mt-1">Hold steady for a second</p>
              </div>
            </>
          )}

          {/* Loading */}
          {cameraStatus === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
              <ScanLine className="h-16 w-16 text-green-500 animate-spin mb-4" />
              <p className="text-white text-lg font-medium">Starting camera...</p>
              <p className="text-white/50 text-sm mt-2">Please allow camera access</p>
            </div>
          )}

          {/* Error */}
          {cameraStatus === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 p-6">
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
                    setMode("manual");
                  }}
                  className="h-12 text-base border-white/20 text-white hover:bg-white/10"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Type Barcode Instead
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // CHOOSE MODE (default)
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white font-semibold text-lg">Scan Product</h2>
        <button
          onClick={() => onClose?.()}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-center space-y-2 mb-4">
          <ScanLine className="h-16 w-16 text-green-500 mx-auto" />
          <h3 className="text-white text-xl font-bold">Scan a Barcode</h3>
          <p className="text-gray-400 text-sm max-w-xs">
            Point your camera at any product barcode to look it up
          </p>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => {
              setMode("camera");
              // Small delay to let DOM render before starting camera
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

          <button
            onClick={() => setMode("manual")}
            className="w-full h-20 bg-gray-800 rounded-2xl flex items-center justify-center gap-3 text-white border border-gray-700 active:scale-[0.98] transition-transform"
          >
            <Keyboard className="h-7 w-7" />
            <div className="text-left">
              <p className="font-bold text-lg leading-tight">Type Barcode</p>
              <p className="text-xs text-gray-400">Enter barcode number manually</p>
            </div>
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-gray-500 text-xs">
            Supports EAN-13, UPC-A, Code 128 barcodes
          </p>
        </div>
      </div>
    </div>
  );
}

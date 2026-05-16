"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { X, Keyboard, Camera, AlertCircle, ScanLine } from "lucide-react";
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
  const [status, setStatus] = useState<"loading" | "active" | "denied" | "error">("loading");
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [lastScanned, setLastScanned] = useState<string>("");
  const [scanCount, setScanCount] = useState(0);
  const [debugMsg, setDebugMsg] = useState("");

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const lastScanTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Debug logging that's visible to user
  const log = useCallback((msg: string) => {
    console.log("[Scanner]", msg);
    setDebugMsg(msg);
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
      osc.frequency.value = 1200;
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // ignore
    }
  }, []);

  const vibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  const lookupProduct = useCallback(
    async (barcode: string) => {
      try {
        log(`Looking up: ${barcode}`);
        const res = await fetch(`/api/scan?code=${encodeURIComponent(barcode)}`);
        if (res.ok) {
          const product: Product = await res.json();
          log(`Found: ${product.name}`);
          return { type: "product" as const, product };
        }
        if (res.status === 404) {
          log(`Not found: ${barcode}`);
          return { type: "not_found" as const, barcode };
        }
        log(`Lookup failed: ${res.status}`);
        return { type: "error" as const, message: "Lookup failed" };
      } catch (e: any) {
        log(`Network error: ${e.message}`);
        return { type: "error" as const, message: "Network error" };
      }
    },
    [log]
  );

  const handleScan = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      // Debounce: ignore same barcode within 1.5 seconds
      if (decodedText === lastScanned && now - lastScanTimeRef.current < 1500) {
        log(`Ignored duplicate: ${decodedText}`);
        return;
      }
      lastScanTimeRef.current = now;
      setLastScanned(decodedText);
      setScanCount((c) => c + 1);

      playBeep();
      vibrate();
      log(`Scanned: ${decodedText}`);

      const result = await lookupProduct(decodedText);
      onScan(result);
      onClose?.();
    },
    [lastScanned, onScan, onClose, playBeep, vibrate, lookupProduct, log]
  );

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) {
      log("Scanner container not found");
      setStatus("error");
      return;
    }

    setStatus("loading");
    log("Initializing scanner...");

    try {
      // Dynamic import - must work in production
      const mod = await import("html5-qrcode");
      log("Library loaded");

      const Html5Qrcode = mod.Html5Qrcode;
      if (!Html5Qrcode) {
        log("Html5Qrcode class not found in module");
        setStatus("error");
        return;
      }

      const scanner = new Html5Qrcode("scanner-video-container");
      html5QrCodeRef.current = scanner;
      log("Scanner instance created");

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          // Use percentage-based qrbox for better mobile compatibility
          qrbox: function (viewfinderWidth: number, viewfinderHeight: number) {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return {
              width: qrboxSize,
              height: Math.floor(qrboxSize * 0.5),
            };
          },
        },
        (decodedText: string) => {
          handleScan(decodedText);
        },
        (errorMessage: string) => {
          // This fires continuously while no code is found - we ignore most
          // but log first few for debugging
        }
      );

      log("Camera started successfully");
      setStatus("active");
    } catch (err: any) {
      console.error("Scanner start error:", err);
      log(`Error: ${err.message || err}`);

      if (err.name === "NotAllowedError" || err.message?.includes("permission")) {
        setStatus("denied");
        toast({
          title: "Camera access denied",
          description: "Please allow camera permission in your browser",
          variant: "error",
        });
      } else if (err.message?.includes("NotFound")) {
        setStatus("error");
        toast({
          title: "Camera not found",
          description: "No camera detected on this device",
          variant: "error",
        });
      } else {
        setStatus("error");
        toast({
          title: "Scanner failed to start",
          description: err.message || "Unknown error",
          variant: "error",
        });
      }
    }
  }, [handleScan, toast, log]);

  const stopScanner = useCallback(async () => {
    log("Stopping scanner...");
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        log("Scanner stopped");
      }
    } catch (e: any) {
      log(`Stop error: ${e.message || e}`);
    }
  }, [log]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    log(`Manual entry: ${manualCode.trim()}`);
    handleScan(manualCode.trim());
    setManualCode("");
    setShowManual(false);
  };

  // Start scanner on mount
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual entry screen
  if (showManual) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center justify-between p-4 bg-black/80">
          <h2 className="text-white font-semibold">Enter Barcode</h2>
          <button
            onClick={() => setShowManual(false)}
            className="p-2 rounded-full bg-white/10 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
          <input
            type="text"
            inputMode="numeric"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
            placeholder="Type barcode number..."
            autoFocus
            className="w-full max-w-sm px-4 py-3 rounded-xl bg-white text-gray-900 text-lg font-mono text-center outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button
            onClick={handleManualSubmit}
            disabled={!manualCode.trim()}
            className="w-full max-w-sm h-12 text-base font-semibold"
          >
            Lookup Product
          </Button>
          <button
            onClick={() => setShowManual(false)}
            className="text-gray-400 text-sm"
          >
            Back to Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          {status === "active" && (
            <div className="flex items-center gap-1.5 bg-green-500/90 px-2.5 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-semibold">Scanning</span>
            </div>
          )}
          {status === "loading" && (
            <div className="flex items-center gap-1.5 bg-amber-500/90 px-2.5 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-semibold">Starting...</span>
            </div>
          )}
          {scanCount > 0 && (
            <span className="text-white/80 text-xs font-medium">
              {scanCount} scanned
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManual(true)}
            className="p-2.5 rounded-full bg-white/15 text-white"
            title="Enter barcode manually"
          >
            <Keyboard className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              stopScanner();
              onClose?.();
            }}
            className="p-2.5 rounded-full bg-white/15 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Camera view */}
      <div className="relative flex-1 overflow-hidden">
        {/* Error / Denied State */}
        {(status === "denied" || status === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <Camera className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">
              {status === "denied" ? "Camera Access Required" : "Scanner Error"}
            </h3>
            <p className="text-gray-400 text-sm mb-2">
              {status === "denied"
                ? "Please allow camera permission in your browser settings"
                : "Could not start the camera scanner"}
            </p>
            {debugMsg && (
              <p className="text-gray-500 text-xs font-mono mb-6 bg-black/50 px-3 py-1 rounded">
                {debugMsg}
              </p>
            )}
            <Button onClick={startScanner} className="h-12 px-6 mb-3">
              Try Again
            </Button>
            <button
              onClick={() => setShowManual(true)}
              className="text-green-400 text-sm font-medium"
            >
              Enter barcode manually
            </button>
          </div>
        )}

        {/* Scanner container - always render, camera fills it */}
        <div
          id="scanner-video-container"
          ref={scannerRef}
          className="w-full h-full"
        />

        {/* Scan frame overlay - only when active */}
        {status === "active" && (
          <>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[70vw] max-w-[320px] h-[35vw] max-h-[160px]">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                {/* Animated scan line */}
                <div className="absolute left-0 right-0 h-[2px] bg-green-400/80 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-scan-line" />
              </div>
            </div>

            {/* Bottom hint */}
            <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
              <p className="text-white/70 text-sm font-medium">
                Point camera at barcode
              </p>
            </div>
          </>
        )}

        {/* Loading overlay */}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <ScanLine className="h-12 w-12 text-green-500 animate-pulse mb-3" />
            <p className="text-white/80 text-sm font-medium">Starting camera...</p>
            {debugMsg && (
              <p className="text-gray-500 text-xs font-mono mt-2">{debugMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

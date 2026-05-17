"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { X, Keyboard, Camera, ScanLine, Loader2, CheckCircle } from "lucide-react";
import type { Product } from "@/types";

type ScanResult =
  | { type: "product"; product: Product }
  | { type: "not_found"; barcode: string }
  | { type: "error"; message: string };

type ScanPhase = "choose" | "camera_loading" | "camera_active" | "camera_error" | "searching" | "found" | "not_found";

interface BarcodeScannerProps {
  onScan: (result: ScanResult) => void;
  onClose?: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [phase, setPhase] = useState<ScanPhase>("choose");
  const [errorMsg, setErrorMsg] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [lastBarcode, setLastBarcode] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<any>(null);
  const lastBarcodeRef = useRef<string>("");
  const lastScanAtRef = useRef<number>(0);
  const isSearchingRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Debug logger
  const log = useCallback((msg: string) => {
    console.log(`[Scanner] ${msg}`);
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
          const product: Product = await res.json();
          log(`Found product: ${product.name}`);
          return { type: "product", product };
        }
        if (res.status === 404) {
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

  const handleDecodedBarcode = useCallback(
    async (barcode: string) => {
      // Debounce: ignore same barcode within 2 seconds
      if (
        barcode === lastBarcodeRef.current &&
        Date.now() - lastScanAtRef.current < 2000
      ) {
        log(`Debounced duplicate: ${barcode}`);
        return;
      }

      // Ignore if already searching
      if (isSearchingRef.current) {
        log(`Already searching, ignoring: ${barcode}`);
        return;
      }

      lastBarcodeRef.current = barcode;
      lastScanAtRef.current = Date.now();
      isSearchingRef.current = true;
      setLastBarcode(barcode);

      // Immediate feedback
      playBeep();
      vibrate();
      log(`Decoded barcode: ${barcode}`);

      setPhase("searching");

      // Lookup product
      const result = await lookupProduct(barcode);

      isSearchingRef.current = false;

      if (result.type === "product") {
        setPhase("found");
        toast({
          title: "Product found!",
          description: result.product.name,
          variant: "success",
        });
      } else if (result.type === "not_found") {
        setPhase("not_found");
        toast({
          title: "New product",
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

      onScan(result);
    },
    [lookupProduct, onScan, playBeep, vibrate, toast, log]
  );

  const startCamera = useCallback(async () => {
    setPhase("camera_loading");
    setErrorMsg("");
    log("Starting ZXing camera...");

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      log("ZXing reader created");

      // Get all video input devices and prefer back camera
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      log(`Found ${devices.length} video devices`);

      let selectedDeviceId: string | undefined;
      const backCamera = devices.find(
        (d: any) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
      );
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
        log(`Using back camera: ${backCamera.label}`);
      } else if (devices.length > 0) {
        selectedDeviceId = devices[0].deviceId;
        log(`Using first camera: ${devices[0].label}`);
      }

      // Decode hints for 1D barcodes
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");
      const hints = new Map();
      // Prioritize 1D formats commonly found on grocery products
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.ITF,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      // Pass hints to constructor
      const readerWithHints = new BrowserMultiFormatReader(hints);
      readerRef.current = readerWithHints;

      // Start continuous decode
      await readerWithHints.decodeFromVideoDevice(
        selectedDeviceId ?? undefined,
        videoRef.current,
        (result: any, err: any) => {
          if (result) {
            const text = result.getText();
            log(`ZXing decode success: ${text}`);
            handleDecodedBarcode(text);
          }
          if (err && !(err.name === "NotFoundException")) {
            // Only log real errors, ignore "no barcode found" spam
            log(`ZXing decode error: ${err.name || err}`);
          }
        }
      );

      setPhase("camera_active");
      log("Camera active, scanning...");
    } catch (err: any) {
      console.error("Camera start error:", err);
      log(`Camera error: ${err.message || err}`);

      let msg = err.message || "Could not start camera";
      if (err.name === "NotAllowedError") {
        msg = "Camera permission denied. Please allow camera access.";
      } else if (err.name === "NotFoundError") {
        msg = "No camera found on this device.";
      } else if (msg.includes("is not supported")) {
        msg = "Barcode scanning not supported on this browser.";
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

  const stopCamera = useCallback(async () => {
    log("Stopping camera...");
    try {
      if (readerRef.current) {
        await readerRef.current.reset();
        readerRef.current = null;
        log("Camera stopped");
      }
    } catch (e: any) {
      log(`Stop error: ${e.message}`);
    }
  }, [log]);

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

  // Manual entry screen
  if (phase === "choose" || phase === "not_found") {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col no-select">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-lg">
            {phase === "not_found" ? "Barcode Not Found" : "Scan Product"}
          </h2>
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
          {phase === "not_found" && lastBarcode && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 text-center w-full max-w-sm">
              <p className="text-amber-400 text-sm font-medium mb-1">Scanned Barcode</p>
              <p className="text-white text-2xl font-mono font-bold">{lastBarcode}</p>
              <p className="text-gray-400 text-xs mt-2">This product is not in your database</p>
            </div>
          )}

          <div className="text-center space-y-2">
            <ScanLine className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-white/70 text-sm">
              {phase === "not_found"
                ? "Add this product or scan another"
                : "Choose how to scan"}
            </p>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => {
                setPhase("camera_loading");
                setTimeout(() => startCamera(), 50);
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

  // Camera screen
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

      {/* Video + overlays */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Wide horizontal scan frame - optimized for 1D barcodes */}
        {(phase === "camera_active" || phase === "searching") && (
          <>
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[90vw] max-w-[500px] h-[120px]">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                {/* Animated scan line */}
                <div className="absolute left-0 right-0 h-[3px] bg-green-400 shadow-[0_0_12px_rgba(74,222,128,1)] animate-scan-line" />
              </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 text-center pointer-events-none">
              <p className="text-white/80 text-base font-medium">
                {phase === "searching" ? `Searching: ${lastBarcode}...` : "Point barcode at line"}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-10">
            <ScanLine className="h-16 w-16 text-green-500 animate-spin mb-4" />
            <p className="text-white text-lg font-medium">Starting camera...</p>
            <p className="text-white/50 text-sm mt-2">Please allow camera access</p>
          </div>
        )}

        {/* Error overlay */}
        {phase === "camera_error" && (
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
      </div>
    </div>
  );
}



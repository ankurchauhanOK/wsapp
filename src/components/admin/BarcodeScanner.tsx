"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { X, Flashlight, Keyboard, Camera, AlertCircle } from "lucide-react";
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
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [lastScanned, setLastScanned] = useState<string>("");
  const [scanCount, setScanCount] = useState(0);

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const { toast } = useToast();

  // Beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 1200;
      gain.gain.value = 0.1;
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // ignore audio errors
    }
  }, []);

  const vibrate = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
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
        return { type: "error" as const, message: "Lookup failed" };
      } catch {
        return { type: "error" as const, message: "Network error" };
      }
    },
    []
  );

  const handleScan = useCallback(
    async (decodedText: string) => {
      const now = Date.now();
      // Debounce: ignore same barcode within 1.5 seconds
      if (decodedText === lastScanned && now - lastScanTimeRef.current < 1500) {
        return;
      }
      lastScanTimeRef.current = now;
      setLastScanned(decodedText);
      setScanCount((c) => c + 1);

      playBeep();
      vibrate();

      const result = await lookupProduct(decodedText);
      onScan(result);
      onClose?.();
    },
    [lastScanned, onScan, onClose, playBeep, vibrate, lookupProduct]
  );

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return;
    setIsScanning(true);
    setHasPermission(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("scanner-video-container");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 280, height: 140 },
          aspectRatio: 1.777,
        },
        (decodedText: string) => {
          handleScan(decodedText);
        },
        () => {
          // qrCodeErrorCallback - ignore continuous errors
        }
      );

      setHasPermission(true);

      // Try to get the media stream for flashlight control
      try {
        const tracks = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = tracks;
      } catch {
        // flashlight not available
      }
    } catch (err: any) {
      console.error("Scanner start error:", err);
      setHasPermission(false);
      setIsScanning(false);
      toast({
        title: "Camera access denied",
        description: "Please allow camera permission to scan barcodes",
        variant: "error",
      });
    }
  }, [handleScan, toast]);

  const stopScanner = useCallback(async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
    } catch {
      // ignore
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setHasPermission(null);
  }, []);

  const toggleFlashlight = useCallback(async () => {
    try {
      const videoTrack = streamRef.current?.getVideoTracks()[0];
      if (!videoTrack) return;
      const capabilities = videoTrack.getCapabilities() as any;
      if (capabilities?.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashOn } as MediaTrackConstraintSet],
        });
        setFlashOn(!flashOn);
      }
    } catch {
      toast({ title: "Flashlight not available", variant: "error" });
    }
  }, [flashOn, toast]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    handleScan(manualCode.trim());
    setManualCode("");
    setShowManual(false);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            placeholder="Type barcode..."
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
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-green-500/90 px-2.5 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-semibold">Scanning</span>
          </div>
          {scanCount > 0 && (
            <span className="text-white/80 text-xs font-medium">
              {scanCount} scanned
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFlashlight}
            className={`p-2.5 rounded-full transition-colors ${
              flashOn ? "bg-amber-400 text-black" : "bg-white/15 text-white"
            }`}
          >
            <Flashlight className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowManual(true)}
            className="p-2.5 rounded-full bg-white/15 text-white"
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
        {hasPermission === false ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Camera className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">
              Camera Access Required
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Please allow camera access in your browser settings to scan barcodes
            </p>
            <Button onClick={startScanner} className="h-12 px-6">
              Try Again
            </Button>
            <button
              onClick={() => setShowManual(true)}
              className="mt-3 text-green-400 text-sm font-medium"
            >
              Enter barcode manually
            </button>
          </div>
        ) : (
          <>
            <div
              id="scanner-video-container"
              ref={scannerRef}
              className="w-full h-full"
            />

            {/* Scan frame overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-[280px] h-[140px]">
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />

                {/* Animated scan line */}
                <div className="absolute left-0 right-0 h-[2px] bg-green-400/80 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-scan-line" />

                {/* Center reticle dot */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-green-400/60" />
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
      </div>
    </div>
  );
}

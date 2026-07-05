"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  CameraOff,
  SwitchCamera,
  X,
  Loader2,
} from "lucide-react";

interface CameraScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

interface ScannerHandle {
  stop(): Promise<void>;
  clear(): void;
}

const CONTAINER_ID = "camera-scanner-view";

type ScannerState = "idle" | "initializing" | "scanning" | "error";

export function CameraScannerModal({
  open,
  onOpenChange,
  onScan,
}: CameraScannerModalProps) {
  const [state, setState] = useState<ScannerState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [canFlip, setCanFlip] = useState(false);
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  const scannerRef = useRef<ScannerHandle | null>(null);
  const scannedRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onOpenChangeRef = useRef(onOpenChange);

  // Keep refs in sync without violating React 19 rules
  useEffect(() => {
    onScanRef.current = onScan;
    onOpenChangeRef.current = onOpenChange;
  });

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current;
    if (!s) return;
    try {
      await s.stop();
      await s.clear();
    } catch {
      // ignore cleanup errors
    }
    scannerRef.current = null;
    setState("idle");
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onOpenChangeRef.current(false);
  }, [stopCamera]);

  const startCamera = useCallback(
    async (deviceId?: string) => {
      setState("initializing");
      setErrorMsg("");
      scannedRef.current = false;

      try {
        const {
          Html5Qrcode,
          Html5QrcodeSupportedFormats,
        } = await import("html5-qrcode");

        if (scannerRef.current) {
          await scannerRef.current.stop();
          await scannerRef.current.clear();
          scannerRef.current = null;
        }

        const el = document.getElementById(CONTAINER_ID);
        if (!el || !el.parentElement) return;
        if (el.clientWidth === 0) return;

        const scanner = new Html5Qrcode(CONTAINER_ID, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        });
        scannerRef.current = scanner;

        await scanner.start(
          deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 120 },
            disableFlip: false,
          },
          (text: string) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            onScanRef.current(text);
            stopCamera().then(() => {
              onOpenChangeRef.current(false);
            });
          },
          () => {}
        );

        setState("scanning");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown camera error";
        const name = err instanceof Error ? err.name : "";
        const msg =
          name === "NotAllowedError" ||
          message.toLowerCase().includes("permission")
            ? "Camera permission denied. Please allow camera access in your browser or device settings."
            : name === "NotFoundError" ||
                message.toLowerCase().includes("no camera")
              ? "No camera found on this device."
              : message || "Could not start camera. Please try again.";
        setErrorMsg(msg);
        setState("error");
      }
    },
    [stopCamera]
  );

  const switchCamera = useCallback(async () => {
    if (devices.length < 2) return;
    const idx = devices.findIndex((d) => d.id === currentDeviceId);
    const next = (idx + 1) % devices.length;
    const nextId = devices[next].id;
    setCurrentDeviceId(nextId);
    await startCamera(nextId);
  }, [devices, currentDeviceId, startCamera]);

  const enumerateCameras = useCallback(async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const cams = await Html5Qrcode.getCameras();
      setDevices(cams);
      setCanFlip(cams.length > 1);
      if (cams.length > 0) {
        setCurrentDeviceId(cams[0].id);
      }
    } catch {
      // camera enumeration failed, proceed with facingMode
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    let cancelled = false;
    (async () => {
      await startCamera();
      if (cancelled) return;
      enumerateCameras();
    })();
    return () => {
      cancelled = true;
    };
  }, [open, startCamera, stopCamera, enumerateCameras]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-frap animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Scan Barcode</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div
          className="relative bg-black"
          style={{ minHeight: "280px", maxHeight: "65vh" }}
        >
          <div
            id={CONTAINER_ID}
            className="w-full h-full"
            style={{ minHeight: "inherit" }}
          />

          {/* Loading indicator */}
          {state === "initializing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20">
              <Loader2 className="h-10 w-10 text-green-400 animate-spin mb-3" />
              <p className="text-white text-sm font-medium">
                Starting camera...
              </p>
              <p className="text-white/50 text-xs mt-1">
                Please allow camera access
              </p>
            </div>
          )}

          {/* Error overlay */}
          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-6">
              <CameraOff className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-white text-sm font-semibold mb-1">
                Camera Error
              </p>
              <p className="text-gray-400 text-xs text-center mb-4 max-w-[240px]">
                {errorMsg}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startCamera()}>
                  Try Again
                </Button>
                <Button
                  variant="outline-dark"
                  size="sm"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Scan overlay */}
          {state === "scanning" && (
            <>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="relative w-[80%] max-w-[300px] h-[100px]">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                  <div className="absolute left-0 right-0 h-[2px] bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)] animate-scan-line" />
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                <p className="text-white/70 text-xs">
                  Point camera at barcode
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          {state === "scanning" ? (
            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-xs font-semibold">
                Scanning
              </span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {canFlip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={switchCamera}
                className="gap-1 text-xs"
              >
                <SwitchCamera className="h-3.5 w-3.5" />
                Flip
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

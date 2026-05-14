"use client";

import { useState, useEffect } from "react";

export function useQRCode(text: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      try {
        const QRCode = (await import("qrcode")).default;
        if (cancelled) return;
        const url = await QRCode.toDataURL(text, {
          width: 400,
          margin: 2,
          color: { dark: "#166534", light: "#ffffff" },
        });
        if (!cancelled) setDataUrl(url);
      } catch {
        // QR generation failed silently
      }
    }
    generate();
    return () => { cancelled = true; };
  }, [text]);

  return dataUrl;
}

"use client";

import { Barcode, Loader2, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { detectBarcode } from "@/lib/browser-vision/barcode";
import { matchCanvasAll } from "@/lib/browser-vision/histogram";
import type { ProfileData } from "@/lib/browser-vision/types";
import type { CheckoutProduct } from "@/components/pos/checkout-console";

let cachedProfiles: ProfileData[] | null = null;

async function loadProfiles(): Promise<ProfileData[]> {
  if (cachedProfiles) return cachedProfiles;
  try {
    const res = await fetch("/api/products/embeddings");
    if (!res.ok) return [];
    const data = await res.json();
    cachedProfiles = data.profiles || [];
  } catch {
    cachedProfiles = [];
  }
  return cachedProfiles!;
}

type ScanPhase = "idle" | "scanning" | "detected" | "matched" | "error";

export function CameraScanner({
  products,
  onProductMatched,
}: {
  products: CheckoutProduct[];
  onProductMatched: (product: CheckoutProduct) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [scanPhase, setScanPhase] = useState<ScanPhase>("idle");
  const [lastMatch, setLastMatch] = useState<{ name: string; time: number } | null>(null);
  const [lastBarcodeDisplay, setLastBarcodeDisplay] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const lastBarcodeRef = useRef<string | null>(null);
  const lastBarcodeTimeRef = useRef(0);
  const lastBarcodeScanAtRef = useRef(0);
  const lastZxingScanAtRef = useRef(0);
  const lastVisionScanAtRef = useRef(0);
  const lastVisionProductRef = useRef<string | null>(null);
  const lastVisionProductTimeRef = useRef(0);
  const lastOcrTimeRef = useRef(0);
  const scanningRef = useRef(false);
  const visionProfilesRef = useRef<ProfileData[]>([]);
  const visionConsecutiveProductRef = useRef<string | null>(null);
  const visionConsecutiveCountRef = useRef(0);
  const visionRunningRef = useRef(false);
  const ocrRunningRef = useRef(false);
  const scanCountRef = useRef(0);
  const lastScanCountUiAtRef = useRef(0);
  const matchedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productByCode = useMemo(() => {
    const map = new Map<string, CheckoutProduct>();
    for (const product of products) {
      if (product.barcode) map.set(product.barcode, product);
      map.set(product.sku, product);
    }
    return map;
  }, [products]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  function flashMatch(name: string) {
    setLastMatch({ name, time: Date.now() });
    setScanPhase("matched");
    if (matchedTimeoutRef.current) clearTimeout(matchedTimeoutRef.current);
    matchedTimeoutRef.current = setTimeout(() => setScanPhase("scanning"), 1500);
  }

  const tryMatchRef = useRef(async () => {});

  tryMatchRef.current = async () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    const now = Date.now();
    scanCountRef.current++;
    if (now - lastScanCountUiAtRef.current > 500) {
      lastScanCountUiAtRef.current = now;
      setScanCount(scanCountRef.current);
    }

    // Native barcode scans fast; ZXing fallback is throttled because it is heavier.
    if (now - lastBarcodeScanAtRef.current > 70) {
      lastBarcodeScanAtRef.current = now;
      const useZxingFallback = now - lastZxingScanAtRef.current > 220;
      if (useZxingFallback) lastZxingScanAtRef.current = now;
      try {
        const barcode = await detectBarcode(video, { fallback: useZxingFallback, maxSize: 420 });
        if (barcode) {
          if (barcode !== lastBarcodeRef.current || now - lastBarcodeTimeRef.current > 3000) {
            const product = productByCode.get(barcode);
            if (product) {
              lastBarcodeRef.current = barcode;
              lastBarcodeTimeRef.current = now;
              setLastBarcodeDisplay(barcode);
              flashMatch(product.name);
              onProductMatched(product);
              return;
            }
          }
          return;
        }
      } catch {}
    }

    // Vision runs in the background so product recognition does not block barcode scans.
    if (visionProfilesRef.current.length > 0 && !visionRunningRef.current && now - lastVisionScanAtRef.current >= 300) {
      lastVisionScanAtRef.current = now;
      visionRunningRef.current = true;
      setScanPhase("scanning");
      const sourceW = video.videoWidth || 640;
      const sourceH = video.videoHeight || 480;
      const scale = Math.min(224 / sourceW, 224 / sourceH, 1);
      const visionCanvas = document.createElement("canvas");
      visionCanvas.width = Math.max(1, Math.round(sourceW * scale));
      visionCanvas.height = Math.max(1, Math.round(sourceH * scale));
      const ctx = visionCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, visionCanvas.width, visionCanvas.height);
        void (async () => {
          try {
            const result = await matchCanvasAll(visionCanvas, visionProfilesRef.current);
            const matchTime = Date.now();
            if (result?.accepted) {
              if (result.productId === visionConsecutiveProductRef.current) {
                visionConsecutiveCountRef.current++;
              } else {
                visionConsecutiveProductRef.current = result.productId;
                visionConsecutiveCountRef.current = 1;
              }
              if (visionConsecutiveCountRef.current >= 2) {
                const product = productById.get(result.productId);
                const canAdd = result.productId !== lastVisionProductRef.current || matchTime - lastVisionProductTimeRef.current > 6000;
                if (product && canAdd) {
                  lastVisionProductRef.current = result.productId;
                  lastVisionProductTimeRef.current = matchTime;
                  visionConsecutiveCountRef.current = 0;
                  flashMatch(product.name);
                  onProductMatched(product);
                }
              } else {
                setScanPhase("detected");
              }
            } else {
              visionConsecutiveProductRef.current = null;
              visionConsecutiveCountRef.current = 0;
            }
          } finally {
            visionRunningRef.current = false;
          }
        })();
      } else {
        visionRunningRef.current = false;
      }
    }

    // OCR is a slow fallback, so it always runs in the background.
    if (!ocrRunningRef.current && now - lastOcrTimeRef.current > 4500 && products.length > 0) {
      lastOcrTimeRef.current = now;
      ocrRunningRef.current = true;
      const sourceW = video.videoWidth || 640;
      const sourceH = video.videoHeight || 480;
      const ocrCanvas = document.createElement("canvas");
      ocrCanvas.width = Math.max(1, Math.round(sourceW * 0.35));
      ocrCanvas.height = Math.max(1, Math.round(sourceH * 0.35));
      const ctx = ocrCanvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, ocrCanvas.width, ocrCanvas.height);
        void (async () => {
          try {
            const { recognizeText, fuzzyMatchProduct } = await import("@/lib/browser-vision/ocr");
            const text = await recognizeText(ocrCanvas, 2500);
            if (text) {
              const match = fuzzyMatchProduct(text, products);
              if (match) {
                const product = productById.get(match.productId);
                if (product) {
                  flashMatch(product.name);
                  onProductMatched(product);
                }
              }
            }
          } finally {
            ocrRunningRef.current = false;
          }
        })();
      } else {
        ocrRunningRef.current = false;
      }
    }
  };

  useEffect(() => {
    let running = true;
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (!running) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState("ready");
        setScanPhase("scanning");

        visionProfilesRef.current = await loadProfiles();

        scanningRef.current = true;
        const scan = async () => {
          if (!scanningRef.current) return;
          await tryMatchRef.current();
          requestAnimationFrame(scan);
        };
        requestAnimationFrame(scan);
      } catch (err) {
        if (!running) return;
        const msg = String(err);
        if (msg.includes("NotAllowed") || msg.includes("Permission")) {
          setCameraState("denied");
        } else {
          setCameraState("error");
        }
      }
    }
    init();
    return () => { running = false; };
  }, []);

  useEffect(() => {
    return () => {
      scanningRef.current = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (matchedTimeoutRef.current) clearTimeout(matchedTimeoutRef.current);
    };
  }, []);

  const phaseColor = scanPhase === "matched" ? "bg-emerald-500" : scanPhase === "detected" ? "bg-amber-400" : scanPhase === "scanning" ? "bg-[#15bdf2]" : "bg-[#94a3b8]";
  const phaseLabel = scanPhase === "matched" ? "Matched!" : scanPhase === "detected" ? "Detecting..." : scanPhase === "scanning" ? "Scanning" : "Idle";

  return (
    <Card className="mb-5 overflow-hidden p-0">
      <div className="flex items-center gap-5 p-4">
        {/* Camera preview */}
        <div className="relative aspect-video w-2/5 overflow-hidden rounded-[20px] bg-[#060b1f]">
          {cameraState === "loading" && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          )}
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />

          {/* Crosshair overlay */}
          {cameraState === "ready" && (
            <div className="pointer-events-none absolute inset-0 z-10">
              {/* Animated scan line */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#15bdf2] to-transparent" style={{ animation: "scanLine 2s ease-in-out infinite" }} />

              {/* Center crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`relative h-20 w-20 rounded-full border-2 transition-colors duration-300 ${scanPhase === "matched" ? "border-emerald-400" : scanPhase === "detected" ? "border-amber-400" : "border-white/30"}`}>
                  <div className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-white/50" />
                  <div className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-white/50" />
                  <div className={`absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-300 ${scanPhase === "matched" ? "bg-emerald-400" : scanPhase === "detected" ? "bg-amber-400" : "bg-white/60"}`} />
                </div>
              </div>

              {/* Distance hint */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-[9px] font-medium text-white/80">
                Hold 15-30cm from product
              </div>
            </div>
          )}

          {/* Barcode display */}
          {lastBarcodeDisplay && (
            <div className="absolute bottom-2 left-2 z-20 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">
              <Barcode className="mr-1 inline h-3 w-3" />{lastBarcodeDisplay}
            </div>
          )}

          {/* Match flash overlay */}
          {scanPhase === "matched" && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-emerald-500/20 backdrop-blur-[1px]">
              <div className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg">
                <Zap className="mr-1 inline h-4 w-4" /> {lastMatch?.name}
              </div>
            </div>
          )}
        </div>

        {/* Status panel */}
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${phaseColor} ${scanPhase === "scanning" ? "animate-pulse" : ""}`} />
              <span className="text-sm font-bold text-[#060b1f]">{phaseLabel}</span>
            </div>
            {scanPhase === "scanning" && (
              <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#64748b]">
                {scanCount} frames scanned
              </span>
            )}
          </div>

          <p className="text-xs text-[#64748b]">
            {cameraState === "loading" && "Starting camera..."}
            {cameraState === "denied" && "Camera blocked — tap products below"}
            {cameraState === "error" && "Camera error — tap products below"}
            {cameraState === "ready" && scanPhase === "matched" && lastMatch && (
              <>Matched <span className="font-semibold text-[#060b1f]">{lastMatch.name}</span> — added to cart</>
            )}
            {cameraState === "ready" && scanPhase === "detected" && "Product detected — confirming..."}
            {cameraState === "ready" && scanPhase === "scanning" && "Point product at camera or scan barcode"}
          </p>

          {lastMatch && scanPhase !== "matched" && (
            <p className="text-[10px] text-[#94a3b8]">Last: {lastMatch.name} ({Math.round((Date.now() - lastMatch.time) / 1000)}s ago)</p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 90%; }
        }
      `}</style>
    </Card>
  );
}

"use client";

import { Barcode, Loader2, ScanLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { detectBarcode } from "@/lib/browser-vision/barcode";
import { matchCanvas } from "@/lib/browser-vision/histogram";
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
  const [status, setStatus] = useState("Initialising camera...");
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const [lastBarcodeDisplay, setLastBarcodeDisplay] = useState<string | null>(null);
  const lastBarcodeRef = useRef<string | null>(null);
  const lastBarcodeTimeRef = useRef(0);
  const lastBarcodeScanAtRef = useRef(0);
  const lastVisionScanAtRef = useRef(0);
  const lastVisionProductRef = useRef<string | null>(null);
  const lastVisionProductTimeRef = useRef(0);
  const scanningRef = useRef(false);
  const visionProfilesRef = useRef<ProfileData[]>([]);
  const productByCode = useMemo(() => {
    const map = new Map<string, CheckoutProduct>();
    for (const product of products) {
      if (product.barcode) map.set(product.barcode, product);
      map.set(product.sku, product);
    }
    return map;
  }, [products]);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  const tryMatchRef = useRef(async () => {});

  tryMatchRef.current = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const now = Date.now();

    if (now - lastBarcodeScanAtRef.current > 120) {
      lastBarcodeScanAtRef.current = now;
      const barcode = await detectBarcode(video);
      if (barcode) {
        if (barcode !== lastBarcodeRef.current || now - lastBarcodeTimeRef.current > 3000) {
          const product = productByCode.get(barcode);
          if (product) {
            lastBarcodeRef.current = barcode;
            lastBarcodeTimeRef.current = now;
            setLastBarcodeDisplay(barcode);
            onProductMatched(product);
            return;
          }
        }
        return;
      }
    }

    if (now - lastVisionScanAtRef.current < 650) return;
    lastVisionScanAtRef.current = now;

    if (visionProfilesRef.current.length > 0) {
      const sourceW = video.videoWidth || 640;
      const sourceH = video.videoHeight || 480;
      const scale = Math.min(320 / sourceW, 320 / sourceH, 1);
      canvas.width = Math.max(1, Math.round(sourceW * scale));
      canvas.height = Math.max(1, Math.round(sourceH * scale));
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const result = matchCanvas(canvas, visionProfilesRef.current);
      if (result?.accepted) {
        const product = productById.get(result.productId);
        const canAdd = result.productId !== lastVisionProductRef.current || now - lastVisionProductTimeRef.current > 3000;
        if (product && canAdd) {
          lastVisionProductRef.current = result.productId;
          lastVisionProductTimeRef.current = now;
          onProductMatched(product);
        }
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
        setStatus("Camera ready. Scanning for barcodes...");

        visionProfilesRef.current = await loadProfiles();
        if (visionProfilesRef.current.length > 0) {
          setStatus(`Camera ready. Barcode + vision scanning (${visionProfilesRef.current.length} profiles).`);
        }

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
          setStatus("Camera permission denied. Allow camera in browser settings.");
        } else {
          setCameraState("error");
          setStatus("Could not access camera. Use the product grid to add items.");
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
    };
  }, []);

  return (
    <Card className="mb-5 overflow-hidden p-0">
      <div className="flex items-center gap-5 p-4">
        <div className="relative aspect-video w-2/5 overflow-hidden rounded-[20px] bg-[#060b1f]">
          {cameraState === "loading" && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-white/60" />
            </div>
          )}
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          {lastBarcodeDisplay && (
            <div className="absolute bottom-2 left-2 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">
              <Barcode className="mr-1 inline h-3 w-3" />{lastBarcodeDisplay}
            </div>
          )}
        </div>
        <div className="flex flex-1 items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-[#607080]">Camera Checkout</p>
            <h2 className="mt-1 text-xl font-semibold text-[#060b1f]">Point product at camera</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm leading-5 text-[#607080]">
              {cameraState === "loading" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting camera...</>}
              {cameraState === "denied" && "Camera blocked — tap products below instead"}
              {cameraState === "error" && "Camera error — tap products below instead"}
              {cameraState === "ready" && <><ScanLine className="h-3.5 w-3.5 text-emerald-500" /> {status}</>}
            </p>
          </div>
          {cameraState !== "ready" && (
            <div className="hidden rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 md:block">
              {cameraState === "denied" ? "Blocked" : "Unavailable"}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

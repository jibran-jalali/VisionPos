"use client";

import { Barcode, Camera, ScanLine, StopCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { detectBarcode, isBarcodeSupported } from "@/lib/browser-vision/barcode";
import { matchFrame } from "@/lib/browser-vision/histogram";
import type { ProfileData, MatchResult } from "@/lib/browser-vision/types";
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
  const [status, setStatus] = useState("Camera is off.");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const barcodeSupported = isBarcodeSupported();
  const scanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tryBarcodeMatch = useCallback(
    (barcode: string) => {
      setLastBarcode(barcode);
      const product = products.find((p) => p.sku === barcode || p.id === barcode);
      if (product) {
        onProductMatched(product);
        setStatus(`Barcode matched: ${product.name}`);
        return true;
      }
      return false;
    },
    [products, onProductMatched],
  );

  useEffect(() => {
    if (!isCameraOn || !videoRef.current) {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
      return;
    }

    loadProfiles();

    if (barcodeSupported) {
      scanTimerRef.current = setInterval(async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;
        const barcode = await detectBarcode(video);
        if (barcode && barcode !== lastBarcode) {
          tryBarcodeMatch(barcode);
        }
      }, 500);
    }

    return () => {
      if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    };
  }, [isCameraOn, barcodeSupported, lastBarcode, tryBarcodeMatch]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
      setStatus(barcodeSupported ? "Camera ready. Barcode scanning active." : "Camera ready. Click Scan for vision match.");
    } catch {
      setStatus("Camera permission denied or no webcam found.");
    }
  }

  function stopCamera() {
    if (scanTimerRef.current) clearInterval(scanTimerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOn(false);
    setStatus("Camera stopped.");
    setLastBarcode(null);
  }

  async function scanItem() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsScanning(true);
    setStatus("Matching frame with vision profiles...");

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) { setStatus("Could not capture frame."); return; }

      const profiles = await loadProfiles();
      if (profiles.length === 0) {
        setStatus("No vision profiles available. Train products first.");
        return;
      }

      const result: MatchResult | null = await matchFrame(blob, profiles);
      if (!result || !result.accepted) {
        setStatus(result ? `Low confidence (${Math.round(result.score * 100)}%). Need more frames.` : "No match found.");
        return;
      }

      const product = products.find((p) => p.id === result.productId);
      if (!product) { setStatus("Matched profile not in checkout catalog."); return; }

      onProductMatched(product);
      setStatus(`Vision match: ${product.name} (${Math.round(result.score * 100)}%).`);
    } catch {
      setStatus("Frame matching failed. Try again.");
    } finally {
      setIsScanning(false);
    }
  }

  useEffect(() => stopCamera, []);

  return (
    <Card className="mb-5 p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-[#dfebf3] bg-[#060b1f]">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          {lastBarcode && (
            <div className="absolute bottom-3 left-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
              <Barcode className="mr-1 inline h-3 w-3" />{lastBarcode}
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#607080]">Camera Checkout</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#060b1f]">Scan item into cart</h2>
            <p className="mt-3 text-sm leading-6 text-[#607080]">{status}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            <Button variant="soft" type="button" onClick={startCamera} disabled={isCameraOn}>
              <Camera className="mr-2 h-4 w-4" /> Start camera
            </Button>
            <Button variant="gradient" type="button" onClick={scanItem} disabled={!isCameraOn || isScanning || products.length === 0}>
              <ScanLine className="mr-2 h-4 w-4" /> {isScanning ? "Scanning" : "Scan item"}
            </Button>
            <Button variant="ghost" type="button" onClick={stopCamera} disabled={!isCameraOn}>
              <StopCircle className="mr-2 h-4 w-4" /> Stop
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

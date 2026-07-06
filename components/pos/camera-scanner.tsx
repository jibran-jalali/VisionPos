"use client";

import { Camera, ScanLine, StopCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { matchFrame } from "@/lib/vision-agent";
import type { CheckoutProduct } from "@/components/pos/checkout-console";

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
  const [status, setStatus] = useState("Camera is off. Start it to scan products.");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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
      setStatus("Camera ready. Syncing barcodes to Vision Module...");

      fetch("/api/sync-vision-products", { method: "POST" }).catch(() => {});
    } catch {
      setStatus("Camera permission denied or no webcam found.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOn(false);
    setStatus("Camera stopped.");
  }

  async function scanItem() {
    if (!videoRef.current || !canvasRef.current) {
      setStatus("Start the camera first.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsScanning(true);
    setStatus("Scanning frame with Vision Module...");

    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));

      if (!blob) {
        setStatus("Could not capture camera frame.");
        return;
      }

      const result = await matchFrame(blob);

      if (!result.match) {
        const best = result.candidates[0];
        setStatus(best ? `No confident match. Best: ${best.product_name || best.product_id} (${Math.round(best.score * 100)}%).` : "No product profile matched. Upload a product video first.");
        return;
      }

      const product = products.find((item) => item.id === result.match?.product_id);

      if (!product) {
        setStatus("Matched a product profile that is not in this checkout catalog.");
        return;
      }

      onProductMatched(product);
      const via = result.match.match_type === "barcode" ? "barcode" : "visual";
      const icon = result.match.match_type === "barcode" ? "Barcode" : "Vision";
      setStatus(`${icon}: ${product.name} (${Math.round(result.match.score * 100)}% via ${via}).`);
    } catch {
      setStatus("Vision Module is not loaded or frame matching failed.");
    } finally {
      setIsScanning(false);
    }
  }

  useEffect(() => stopCamera, []);

  return (
    <Card className="mb-5 p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="overflow-hidden rounded-[28px] border border-[#dfebf3] bg-[#060b1f]">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
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

"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save, ScanLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { detectBarcode, isBarcodeSupported } from "@/lib/browser-vision/barcode";
import { computeHistogram } from "@/lib/browser-vision/histogram";

type CapturedFrame = { blob: Blob; url: string };

const TARGET_FRAME_COUNT = 3;
const TRAINING_IMAGE_SIZE = 320;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function computeFrameEmbedding(blob: Blob): Promise<number[]> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(TRAINING_IMAGE_SIZE / bitmap.width, TRAINING_IMAGE_SIZE / bitmap.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return computeHistogram(canvas);
}

export function AddProductFlow() {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [price, setPrice] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("5");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Camera starts automatically. Point the product barcode at the camera or type details manually.");
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedFramesRef = useRef<CapturedFrame[]>([]);
  const barcodeRef = useRef("");
  const skuRef = useRef("");
  const barcodeSupported = isBarcodeSupported();

  useEffect(() => { barcodeRef.current = barcode; }, [barcode]);
  useEffect(() => { skuRef.current = sku; }, [sku]);
  useEffect(() => { capturedFramesRef.current = capturedFrames; }, [capturedFrames]);

  useEffect(() => {
    let mounted = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (!mounted) { stream.getTracks().forEach((track) => track.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState("ready");
        setStatus(barcodeSupported ? "Camera ready. Barcode auto-fill is active." : "Camera ready. Barcode auto-fill not supported in this browser.");
      } catch (err) {
        if (!mounted) return;
        const msg = String(err);
        if (msg.includes("NotAllowed") || msg.includes("Permission")) {
          setCameraState("denied");
          setStatus("Camera permission denied. Allow camera access or enter barcode manually.");
        } else {
          setCameraState("error");
          setStatus("Could not access camera. You can still add product details manually.");
        }
      }
    }
    startCamera();
    return () => {
      mounted = false;
      capturedFramesRef.current.forEach((frame) => URL.revokeObjectURL(frame.url));
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [barcodeSupported]);

  useEffect(() => {
    if (cameraState !== "ready" || !barcodeSupported) return;
    let stopped = false;
    async function scanBarcode() {
      if (stopped) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const value = await detectBarcode(video);
        if (value && value !== barcodeRef.current) {
          setBarcode(value);
          if (!skuRef.current.trim()) setSku(value);
          setStatus(`Barcode captured automatically: ${value}`);
        }
      }
      window.setTimeout(scanBarcode, 180);
    }
    scanBarcode();
    return () => { stopped = true; };
  }, [cameraState, barcodeSupported]);

  async function captureOneFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? { blob, url: URL.createObjectURL(blob) } : null;
  }

  async function autoCapturePhotos() {
    if (cameraState !== "ready") {
      setError("Camera is not ready yet.");
      return;
    }
    setError("");
    setIsCapturing(true);
    setCapturedFrames((prev) => {
      prev.forEach((frame) => URL.revokeObjectURL(frame.url));
      return [];
    });

    const labels = ["front", "side", "back"];
    const frames: CapturedFrame[] = [];
    for (let i = 0; i < TARGET_FRAME_COUNT; i++) {
      setStatus(`Auto-capturing ${labels[i]} photo in ${i === 0 ? "1" : "0.8"}s... Rotate product slowly.`);
      await wait(i === 0 ? 1000 : 800);
      const frame = await captureOneFrame();
      if (frame) {
        frames.push(frame);
        setCapturedFrames([...frames]);
        setStatus(`Captured ${frames.length}/${TARGET_FRAME_COUNT} product photos.`);
      }
    }

    setIsCapturing(false);
    setStatus(frames.length === TARGET_FRAME_COUNT ? "Vision photos ready. Save product when details are complete." : "Could not capture all photos. Try again.");
  }

  function removeFrame(index: number) {
    setCapturedFrames((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function resetAfterSave() {
    setName("");
    setSku("");
    setBarcode("");
    setPrice("");
    setCapturedFrames((prev) => {
      prev.forEach((frame) => URL.revokeObjectURL(frame.url));
      return [];
    });
  }

  async function saveAll() {
    if (!name.trim() || !sku.trim() || !price) {
      setError("Name, SKU, and price are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setStatus("Creating product...");

    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("sku", sku.trim());
      if (barcode.trim()) formData.set("barcode", barcode.trim());
      if (categoryName.trim()) formData.set("categoryName", categoryName.trim());
      formData.set("price", price);
      formData.set("initialQuantity", initialQuantity);
      formData.set("reorderLevel", reorderLevel);

      const res = await fetch("/api/products", { method: "POST", body: formData });
      const resData = await res.json();
      if (!res.ok) {
        setError(res.status === 409 ? "SKU already exists." : resData.error || "Could not create product.");
        return;
      }

      const { productId } = resData;
      if (capturedFrames.length > 0) {
        setStatus("Building fast vision profile...");
        try {
          const embeddings = await Promise.all(capturedFrames.map((frame) => computeFrameEmbedding(frame.blob)));
          await fetch(`/api/products/${productId}/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeddings, frameCount: embeddings.length, embeddingModel: "hsv_histogram_v2_3photo" }),
          });
        } catch {
          setStatus("Product saved, but vision profile failed. You can still scan by barcode.");
          resetAfterSave();
          return;
        }
      }

      resetAfterSave();
      setStatus("Product saved. Ready for the next barcode or product.");
    } catch {
      setError("Could not save product. Check your connection.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Add product</CardTitle>
          <CardDescription>Barcode auto-fill plus 3-photo vision training. No video recording needed.</CardDescription>
        </div>
      </CardHeader>

      <div className="grid gap-4">
        {error && <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

        <div className="relative overflow-hidden rounded-2xl bg-black">
          {cameraState === "loading" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            </div>
          )}
          <video ref={videoRef} autoPlay muted playsInline className="h-64 w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          {barcode && (
            <div className="absolute bottom-3 left-3 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
              <ScanLine className="mr-1 inline h-3.5 w-3.5" />{barcode}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Product name</label>
            <Input placeholder="Coke 500ml" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">SKU</label>
            <Input placeholder="Auto-filled from barcode if empty" value={sku} onChange={(e) => setSku(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Barcode</label>
            <Input placeholder="Point barcode at camera" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Category</label>
            <Input placeholder="Drinks" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Price</label>
            <Input type="number" min="1" step="0.01" placeholder="120" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Stock</label>
            <Input type="number" min="0" step="1" value={initialQuantity} onChange={(e) => setInitialQuantity(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Low alert</label>
            <Input type="number" min="0" step="1" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} required />
          </div>
        </div>

        <div className="rounded-2xl bg-[#f1f7fb] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#060b1f]">Vision photos</p>
              <p className="mt-1 text-sm leading-6 text-[#607080]">Capture front, side, and back automatically. Optional if barcode is available.</p>
            </div>
            <Button type="button" variant="primary" onClick={autoCapturePhotos} disabled={cameraState !== "ready" || isCapturing || isSaving}>
              {isCapturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              {isCapturing ? "Capturing..." : "Auto-capture 3 photos"}
            </Button>
          </div>
          {capturedFrames.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {capturedFrames.map((frame, index) => (
                <div key={frame.url} className="group relative overflow-hidden rounded-xl bg-black">
                  <img src={frame.url} alt={`Vision photo ${index + 1}`} className="h-24 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFrame(index)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">{index + 1}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#f1f7fb] px-4 py-3 text-sm font-medium leading-6 text-[#607080]">
          <Camera className="mr-2 inline h-4 w-4" />
          {status}
        </div>

        <Button variant="gradient" type="button" onClick={saveAll} disabled={isSaving || isCapturing}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save product"}
        </Button>
      </div>
    </Card>
  );
}

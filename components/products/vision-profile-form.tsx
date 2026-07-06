"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Camera, Upload, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { processProductVideo, processProductImages } from "@/lib/vision-agent";

type ProductOption = {
  id: string;
  name: string;
  sku: string;
};

export function VisionProfileForm({ products }: { products: ProductOption[] }) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [video, setVideo] = useState<File | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<{ blob: Blob; url: string }[]>([]);
  const [status, setStatus] = useState("Upload a packaging video or capture frames from camera to build camera checkout.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tab, setTab] = useState<"upload" | "capture">("upload");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedProduct = products.find((product) => product.id === productId);

  useEffect(() => {
    return () => {
      stopCamera();
      capturedFrames.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, []);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setHasPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setHasPermission(false);
      setStatus("Camera access denied. Grant camera permission or use the upload tab.");
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCapturedFrames((prev) => [...prev, { blob, url }]);
      setStatus(`Frame captured (${capturedFrames.length + 1}). Keep capturing from different angles.`);
    }, "image/jpeg", 0.85);
  }

  function removeFrame(index: number) {
    setCapturedFrames((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function switchToCapture() {
    setTab("capture");
    setVideo(null);
    setCapturedFrames([]);
    setStatus("Point the camera at the product packaging and capture frames from different angles.");
    startCamera();
  }

  function switchToUpload() {
    setTab("upload");
    stopCamera();
    setVideo(null);
    setCapturedFrames([]);
    setHasPermission(null);
    setStatus("Upload a packaging video or capture frames from camera to build camera checkout.");
  }

  async function submitProfile() {
    if (!selectedProduct) {
      setStatus("Select a product first.");
      return;
    }

    if (tab === "upload" && !video) {
      setStatus("Select a video file to upload.");
      return;
    }

    if (tab === "capture" && capturedFrames.length === 0) {
      setStatus("Capture at least one frame from the camera.");
      return;
    }

    setIsProcessing(true);
    setStatus("Sending to local Vision Module. Keep it running on port 8767...");

    try {
      let result;

      if (tab === "capture") {
        const files = capturedFrames.map(
          (f, i) => new File([f.blob], `frame-${i + 1}.jpg`, { type: "image/jpeg" }),
        );
        result = await processProductImages({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          images: files,
        });
      } else {
        result = await processProductVideo({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          sku: selectedProduct.sku,
          video: video!,
        });
      }

      await fetch(`/api/products/${selectedProduct.id}/vision-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frameCount: result.frame_count,
          embeddingModel: result.embedding_model,
          profileStatus: result.profile_status,
        }),
      });

      setStatus(`Profile ready for ${selectedProduct.name}. Frames: ${result.frame_count}.`);
      stopCamera();
      router.refresh();
    } catch {
      setStatus("Could not process. Make sure the Vision Module is running on port 8767 and the images are clear.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Vision Profile</CardTitle>
          <CardDescription>Train a product so camera checkout can recognise it.</CardDescription>
        </div>
      </CardHeader>
      <div className="grid gap-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-[#060b1f]">Product</label>
          <select
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-[#dfebf3] bg-white px-4 text-sm text-[#060b1f] outline-none transition focus:border-[#15bdf2] focus:ring-4 focus:ring-sky-100"
          >
            {products.length === 0 ? <option value="">Create a product first</option> : null}
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={switchToUpload}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "upload"
                ? "bg-[#060b1f] text-white"
                : "bg-[#f1f7fb] text-[#607080] hover:bg-[#dfebf3]"
            }`}
          >
            <Upload className="mr-1 inline h-4 w-4" /> Upload video
          </button>
          <button
            type="button"
            onClick={switchToCapture}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "capture"
                ? "bg-[#060b1f] text-white"
                : "bg-[#f1f7fb] text-[#607080] hover:bg-[#dfebf3]"
            }`}
          >
            <Camera className="mr-1 inline h-4 w-4" /> Capture frames
          </button>
        </div>

        {tab === "upload" ? (
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Packaging video (MP4, AVI, MOV)</label>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setVideo(event.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-[#dfebf3] bg-white px-4 py-3 text-sm text-[#607080]"
            />
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-64 w-full object-cover"
              />
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {hasPermission === false && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Camera permission denied. Allow camera access in your browser or use the upload tab.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="primary"
                type="button"
                onClick={captureFrame}
                disabled={!streamRef.current}
              >
                <ImagePlus className="mr-2 h-4 w-4" /> Capture frame
              </Button>
            </div>

            {capturedFrames.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {capturedFrames.map((frame, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg">
                    <img
                      src={frame.url}
                      alt={`Frame ${i + 1}`}
                      className="h-20 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFrame(i)}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {capturedFrames.length > 0 && (
              <div className="rounded-2xl bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                {capturedFrames.length} frame{capturedFrames.length > 1 ? "s" : ""} captured. Click "Build vision profile" to train.
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-[#f1f7fb] px-4 py-3 text-sm font-medium leading-6 text-[#607080]">
          <Camera className="mr-2 inline h-4 w-4" />
          {status}
        </div>
        <Button variant="primary" type="button" onClick={submitProfile} disabled={isProcessing || products.length === 0 || (tab === "upload" && !video) || (tab === "capture" && capturedFrames.length === 0)}>
          <Upload className="mr-2 h-4 w-4" /> {isProcessing ? "Processing..." : "Build vision profile"}
        </Button>
      </div>
    </Card>
  );
}

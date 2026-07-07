"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save, ScanLine, Square, Trash2, Videotape } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { detectBarcode } from "@/lib/browser-vision/barcode";
import { computeHistogram } from "@/lib/browser-vision/histogram";

type CapturedFrame = { blob: Blob; url: string };

const TRAINING_IMAGE_SIZE = 320;
const FRAME_INTERVAL_SECONDS = 0.5;
const MAX_TRAINING_FRAMES = 16;

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
  const [status, setStatus] = useState("Step 1: scan or enter barcode. Step 2: record a short product video for vision training.");
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const extractorRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const capturedFramesRef = useRef<CapturedFrame[]>([]);
  const barcodeRef = useRef("");
  const skuRef = useRef("");

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
        setStatus("Camera ready. Barcode scanner is active. Record video when product details are filled.");
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
  }, []);

  useEffect(() => {
    if (cameraState !== "ready") return;
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
  }, [cameraState]);

  function startRecording() {
    if (cameraState !== "ready") {
      setError("Camera is not ready yet.");
      return;
    }

    if (!streamRef.current) return;
    setError("");
    chunksRef.current = [];
    setCapturedFrames((prev) => {
      prev.forEach((frame) => URL.revokeObjectURL(frame.url));
      return [];
    });

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        extractFramesFromVideo(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setStatus("Recording vision video... Move the product slowly: front, sides, top, and back.");
    } catch {
      setStatus("Could not start recording. Try Chrome or Edge.");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }

  async function extractFramesFromVideo(blob: Blob) {
    setIsExtracting(true);
    setStatus("Extracting training frames from product video...");

    const url = URL.createObjectURL(blob);
    const video = extractorRef.current;
    if (!video) {
      setIsExtracting(false);
      URL.revokeObjectURL(url);
      return;
    }

    video.src = url;
    video.load();

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const frames: CapturedFrame[] = [];
    const maxTime = Math.min(duration, FRAME_INTERVAL_SECONDS * MAX_TRAINING_FRAMES);

    for (let t = 0; t < maxTime; t += FRAME_INTERVAL_SECONDS) {
      video.currentTime = t;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      const canvas = canvasRef.current;
      if (!canvas) continue;

      const sourceW = video.videoWidth || 640;
      const sourceH = video.videoHeight || 480;
      const scale = Math.min(TRAINING_IMAGE_SIZE / sourceW, TRAINING_IMAGE_SIZE / sourceH, 1);
      canvas.width = Math.max(1, Math.round(sourceW * scale));
      canvas.height = Math.max(1, Math.round(sourceH * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const frameBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
      if (frameBlob) frames.push({ blob: frameBlob, url: URL.createObjectURL(frameBlob) });
    }

    URL.revokeObjectURL(url);
    setCapturedFrames(frames);
    setIsExtracting(false);
    setStatus(`${frames.length} training frames ready from ${Math.round(duration)}s video. Remove blurry frames, then save.`);
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
        setStatus("Building vision profile from video frames...");
        try {
          const embeddings = await Promise.all(capturedFrames.map((frame) => computeFrameEmbedding(frame.blob)));
          await fetch(`/api/products/${productId}/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeddings, frameCount: embeddings.length, embeddingModel: "hsv_histogram_v2_video_frames" }),
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
          <CardDescription>Separate barcode scan/manual entry plus video-frame vision training.</CardDescription>
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
          <video ref={extractorRef} className="hidden" muted playsInline />
          {isRecording && (
            <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              REC
            </div>
          )}
          {barcode && (
            <div className="absolute bottom-3 left-3 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
              <ScanLine className="mr-1 inline h-3.5 w-3.5" />{barcode}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-[#f1f7fb] p-4">
          <p className="text-sm font-bold text-[#060b1f]">Barcode entry</p>
          <p className="mt-1 text-sm leading-6 text-[#607080]">
            Point the barcode at the camera to auto-detect it, or type it manually below. If SKU is empty, it fills from the detected barcode.
          </p>
          <div className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#607080] ring-1 ring-[#dfebf3]">
            Barcode scanner active — point product barcode at camera to auto-fill
          </div>
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
              <p className="text-sm font-bold text-[#060b1f]">Video vision training</p>
              <p className="mt-1 text-sm leading-6 text-[#607080]">Record 5-8 seconds while slowly rotating the product. The app extracts frames automatically.</p>
            </div>
            {!isRecording ? (
              <Button type="button" variant="primary" onClick={startRecording} disabled={cameraState !== "ready" || isExtracting || isSaving}>
                {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Videotape className="mr-2 h-4 w-4" />}
                {isExtracting ? "Extracting..." : "Start video"}
              </Button>
            ) : (
              <Button type="button" variant="danger" onClick={stopRecording}>
                <Square className="mr-2 h-4 w-4" /> Stop video
              </Button>
            )}
          </div>
          {isExtracting && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-[#eef2ff] px-4 py-3 text-sm font-semibold text-[#4f46e5]">
              <Loader2 className="h-4 w-4 animate-spin" /> Extracting frames from video...
            </div>
          )}
          {capturedFrames.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {capturedFrames.map((frame, index) => (
                <div key={frame.url} className="group relative overflow-hidden rounded-xl bg-black">
                  <img src={frame.url} alt={`Training frame ${index + 1}`} className="h-20 w-full object-cover" />
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

        <Button variant="gradient" type="button" onClick={saveAll} disabled={isSaving || isRecording || isExtracting}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save product"}
        </Button>
      </div>
    </Card>
  );
}

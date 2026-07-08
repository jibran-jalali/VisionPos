"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Save, ScanLine, Square, Trash2, Videotape } from "lucide-react";
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
  const [variants, setVariants] = useState<{ name: string; priceAdj: number; sku: string; barcode: string }[]>([]);
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
  const barcodeScanRunningRef = useRef(false);
  const lastBarcodeScanAtRef = useRef(0);
  const lastZxingScanAtRef = useRef(0);
  const scannerBufferRef = useRef("");
  const scannerFirstKeyAtRef = useRef(0);
  const scannerLastKeyAtRef = useRef(0);

  useEffect(() => { barcodeRef.current = barcode; }, [barcode]);
  useEffect(() => { skuRef.current = sku; }, [sku]);
  useEffect(() => { capturedFramesRef.current = capturedFrames; }, [capturedFrames]);

  function applyBarcodeValue(rawValue: string, source: "camera" | "scanner" | "manual") {
    const value = rawValue.trim();
    if (!value) return false;

    const previousBarcode = barcodeRef.current.trim();
    if (value === previousBarcode) return false;

    setBarcode(value);
    if (!skuRef.current.trim() || skuRef.current.trim() === previousBarcode) {
      setSku(value);
    }
    setError("");
    setStatus(source === "manual" ? `Barcode entered: ${value}` : `Barcode captured automatically: ${value}`);
    return true;
  }

  function handleBarcodeInput(value: string) {
    const previousBarcode = barcodeRef.current.trim();
    setBarcode(value);
    if (!skuRef.current.trim() || skuRef.current.trim() === previousBarcode) {
      setSku(value.trim());
    }
  }

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
      const now = Date.now();
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !barcodeScanRunningRef.current && now - lastBarcodeScanAtRef.current > 80) {
        barcodeScanRunningRef.current = true;
        lastBarcodeScanAtRef.current = now;
        const useZxingFallback = now - lastZxingScanAtRef.current > 220;
        if (useZxingFallback) lastZxingScanAtRef.current = now;
        try {
          const value = await detectBarcode(video, { fallback: useZxingFallback, maxSize: 420 });
          if (value) applyBarcodeValue(value, "camera");
        } finally {
          barcodeScanRunningRef.current = false;
        }
      }
      window.setTimeout(scanBarcode, 70);
    }
    scanBarcode();
    return () => { stopped = true; };
  }, [cameraState]);

  useEffect(() => {
    function handleScannerKey(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const now = Date.now();
      if (event.key === "Enter") {
        const value = scannerBufferRef.current.trim();
        const elapsed = now - scannerFirstKeyAtRef.current;
        const averageKeyTime = value.length > 0 ? elapsed / value.length : Infinity;
        scannerBufferRef.current = "";
        scannerFirstKeyAtRef.current = 0;
        scannerLastKeyAtRef.current = 0;

        if (value.length >= 4 && elapsed < 900 && averageKeyTime < 80) {
          event.preventDefault();
          applyBarcodeValue(value, "scanner");
        }
        return;
      }

      if (event.key.length !== 1) return;

      if (now - scannerLastKeyAtRef.current > 90) {
        scannerBufferRef.current = "";
        scannerFirstKeyAtRef.current = now;
      }
      scannerBufferRef.current += event.key;
      scannerLastKeyAtRef.current = now;
    }

    window.addEventListener("keydown", handleScannerKey, true);
    return () => window.removeEventListener("keydown", handleScannerKey, true);
  }, []);

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

  function addVariant() {
    setVariants((prev) => [...prev, { name: "", priceAdj: 0, sku: "", barcode: "" }]);
  }

  function updateVariant(index: number, field: string, value: string | number) {
    setVariants((prev) => {
      const next = [...prev];
      (next[index] as Record<string, string | number>)[field] = value;
      return next;
    });
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
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
    setVariants([]);
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
      if (variants.length > 0) formData.set("variants", JSON.stringify(variants));

      const res = await fetch("/api/products", { method: "POST", body: formData });
      const resData = await res.json();
      if (!res.ok) {
        setError(res.status === 409 ? "SKU already exists." : resData.error || "Could not create product.");
        return;
      }

      const { productId } = resData;
      if (capturedFrames.length > 0) {
        setStatus("Building AI vision profile...");
        try {
          let embeddings: number[][];
          let embeddingModel: string;

          try {
            const TIMEOUT_MS = 5000;
            const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS));
            const { extractFeatures } = await import("@/lib/browser-vision/mobilenet");

            const mobilenetEmbeddings: number[][] = [];
            for (const frame of capturedFrames) {
              setStatus(`AI vision: processing frame ${mobilenetEmbeddings.length + 1}/${capturedFrames.length}...`);
              const bitmap = await createImageBitmap(frame.blob);
              const scale = Math.min(320 / bitmap.width, 320 / bitmap.height, 1);
              const c = document.createElement("canvas");
              c.width = Math.max(1, Math.round(bitmap.width * scale));
              c.height = Math.max(1, Math.round(bitmap.height * scale));
              c.getContext("2d")!.drawImage(bitmap, 0, 0, c.width, c.height);
              bitmap.close();
              const features = await Promise.race([extractFeatures(c), timeoutPromise]);
              if (features) mobilenetEmbeddings.push(features);
            }
            if (mobilenetEmbeddings.length > 0) {
              const avg = mobilenetEmbeddings[0].map((_, i) =>
                mobilenetEmbeddings.reduce((s, e) => s + e[i], 0) / mobilenetEmbeddings.length
              );
              embeddings = [avg];
              embeddingModel = "mobilenet_v2";
            } else {
              throw new Error("No features");
            }
          } catch {
            const fallback = await Promise.all(capturedFrames.map((f) => computeFrameEmbedding(f.blob)));
            embeddings = fallback;
            embeddingModel = "hsv_histogram_v2_video_frames";
          }

          setStatus("Saving AI profile...");
          await fetch(`/api/products/${productId}/embeddings`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ embeddings, frameCount: embeddings.length, embeddingModel }),
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

      <div className="grid gap-3">
        {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</div>}

        <div className="relative overflow-hidden rounded-xl bg-black">
          {cameraState === "loading" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
              <Loader2 className="h-8 w-8 animate-spin text-white/70" />
            </div>
          )}
          <video ref={videoRef} autoPlay muted playsInline className="aspect-square w-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <video ref={extractorRef} className="hidden" muted playsInline />
          {cameraState === "ready" && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-1 rounded-full border border-white/40" />
                <div className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 bg-white/60" />
                <div className="absolute left-1/2 top-1/2 h-8 w-px -translate-x-1/2 -translate-y-1/2 bg-white/60" />
                <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
              </div>
            </div>
          )}
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

        <div className="rounded-xl bg-[#f1f7fb] p-3">
          <div className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#607080] ring-1 ring-[#dfebf3]">
            <ScanLine className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" />
            Barcode scanner active — point camera at barcode or use a USB scanner to auto-fill
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#060b1f]">Product name</label>
            <Input placeholder="Coke 500ml" value={name} onChange={(e) => setName(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#060b1f]">SKU</label>
            <Input placeholder="Auto-filled from barcode" value={sku} onChange={(e) => setSku(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#060b1f]">Barcode</label>
            <Input placeholder="Point barcode at camera" value={barcode} onChange={(e) => handleBarcodeInput(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#060b1f]">Category</label>
            <Input placeholder="Drinks" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-[#060b1f]">Price</label>
            <Input type="number" min="1" step="0.01" placeholder="120" value={price} onChange={(e) => setPrice(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#060b1f]">Stock</label>
            <Input type="number" min="0" step="1" value={initialQuantity} onChange={(e) => setInitialQuantity(e.target.value)} required className="h-9 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-[#060b1f]">Low alert</label>
            <Input type="number" min="0" step="1" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} required className="h-9 text-sm" />
          </div>
        </div>

        {variants.length > 0 && (
          <div className="rounded-xl bg-[#f1f7fb] p-3">
            <p className="mb-2 text-xs font-bold text-[#060b1f]">Size Variations</p>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Small, Medium, Large"
                    value={v.name}
                    onChange={(e) => updateVariant(i, "name", e.target.value)}
                    className="h-9 flex-1 text-sm"
                  />
                  <div className="relative w-24">
                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#607080]">+</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="+0"
                      value={v.priceAdj}
                      onChange={(e) => updateVariant(i, "priceAdj", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                      className="h-9 w-full pl-5 text-sm"
                    />
                  </div>
                  <Input
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => updateVariant(i, "sku", e.target.value)}
                    className="h-9 w-28 text-sm"
                  />
                  <Input
                    placeholder="Barcode"
                    value={v.barcode}
                    onChange={(e) => updateVariant(i, "barcode", e.target.value)}
                    className="h-9 w-28 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[24px] text-[#607080] transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <Button type="button" variant="soft" size="sm" onClick={addVariant} className="h-8 text-xs">
          <Plus className="mr-1 h-3.5 w-3.5" /> Add Size
        </Button>

        <div className="rounded-xl bg-[#f1f7fb] p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs font-bold text-[#060b1f]">Video vision training</p>
              <p className="mt-0.5 text-xs text-[#607080]">Record 5-8s rotating the product. Frames extracted automatically.</p>
            </div>
            {!isRecording ? (
              <Button type="button" variant="primary" size="sm" onClick={startRecording} disabled={cameraState !== "ready" || isExtracting || isSaving}>
                {isExtracting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Videotape className="mr-1.5 h-3.5 w-3.5" />}
                {isExtracting ? "Extracting..." : "Start video"}
              </Button>
            ) : (
              <Button type="button" variant="danger" size="sm" onClick={stopRecording}>
                <Square className="mr-1.5 h-3.5 w-3.5" /> Stop
              </Button>
            )}
          </div>
          {isExtracting && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#4f46e5]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting frames from video...
            </div>
          )}
          {capturedFrames.length > 0 && (
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {capturedFrames.map((frame, index) => (
                <div key={frame.url} className="group relative overflow-hidden rounded-lg bg-black">
                  <img src={frame.url} alt={`Frame ${index + 1}`} className="h-12 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFrame(index)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <div className="absolute bottom-0.5 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] font-bold text-white">{index + 1}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg bg-[#f1f7fb] px-3 py-2 text-xs font-medium text-[#607080]">
          {status}
        </div>

        <Button variant="gradient" type="button" onClick={saveAll} disabled={isSaving || isRecording || isExtracting} className="h-10 text-sm">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save product"}
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Trash2, Save, Videotape, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { processProductImages, processProductVideo } from "@/lib/vision-agent";

export function AddProductFlow() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [price, setPrice] = useState("");
  const [initialQuantity, setInitialQuantity] = useState("0");
  const [reorderLevel, setReorderLevel] = useState("5");
  const [error, setError] = useState("");

  const [status, setStatus] = useState("Fill product details and record a short video. One click saves everything.");
  const [isSaving, setIsSaving] = useState(false);
  const [tab, setTab] = useState<"record" | "upload">("record");
  const [isRecording, setIsRecording] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<{ blob: Blob; url: string }[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [cameraState, setCameraState] = useState<"loading" | "ready" | "denied" | "error" | "idle">("idle");
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const extractorRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      stopCamera();
      capturedFrames.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, []);

  useEffect(() => {
    if (tab === "record" && cameraState === "idle") {
      startCamera();
    }
  }, [tab, cameraState]);

  async function startCamera() {
    setCameraState("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
      }
      setCameraState("ready");
    } catch (err) {
      const msg = String(err);
      if (msg.includes("NotAllowed") || msg.includes("Permission")) {
        setCameraState("denied");
      } else {
        setCameraState("error");
      }
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraState("idle");
  }

  function startRecording() {
    if (!streamRef.current || cameraState !== "ready") return;
    chunksRef.current = [];
    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      const recorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        extractFramesFromVideo(blob);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setStatus("Recording... Move the product slowly to show all sides.");
    } catch {
      setStatus("Could not start recording. Try a different browser.");
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
    setStatus("Extracting frames from video...");

    const url = URL.createObjectURL(blob);
    const video = extractorRef.current;
    if (!video) {
      setIsExtracting(false);
      return;
    }

    video.src = url;
    video.load();

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => resolve();
    });

    const duration = video.duration;
    const interval = 0.5;
    const frames: { blob: Blob; url: string }[] = [];

    for (let t = 0; t < duration; t += interval) {
      video.currentTime = t;
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
      });

      const canvas = canvasRef.current;
      if (!canvas) continue;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.drawImage(video, 0, 0);

      const frameBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85);
      });

      if (frameBlob) {
        frames.push({ blob: frameBlob, url: URL.createObjectURL(frameBlob) });
      }
    }

    URL.revokeObjectURL(url);
    setCapturedFrames(frames);
    setIsExtracting(false);
    setStatus(`${frames.length} frames extracted from ${Math.round(duration)}s video. Remove any blurry ones.`);
  }

  function removeFrame(index: number) {
    setCapturedFrames((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function saveAll() {
    if (!name.trim() || !sku.trim() || !price) {
      setError("Name, SKU, and price are required.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("name", name.trim());
      formData.set("sku", sku.trim());
      if (barcode.trim()) formData.set("barcode", barcode.trim());
      if (categoryName.trim()) formData.set("categoryName", categoryName.trim());
      formData.set("price", price);
      formData.set("initialQuantity", initialQuantity);
      formData.set("reorderLevel", reorderLevel);

      setStatus("Creating product...");
      const res = await fetch("/api/products", { method: "POST", body: formData });
      const resData = await res.json();

      if (!res.ok) {
        setError(res.status === 409 ? "SKU already exists." : resData.error || "Could not create product.");
        setIsSaving(false);
        return;
      }

      const { productId, name: productName, sku: productSku, barcode: productBarcode } = resData;
      const hasVision = capturedFrames.length > 0 || video !== null;

      if (hasVision) {
        setStatus("Building vision profile...");

        let result;
        if (capturedFrames.length > 0) {
          const files = capturedFrames.map(
            (f, i) => new File([f.blob], `frame-${i + 1}.jpg`, { type: "image/jpeg" }),
          );
          result = await processProductImages({ productId, productName, sku: productSku, barcode: productBarcode, images: files });
        } else {
          result = await processProductVideo({ productId, productName, sku: productSku, barcode: productBarcode, video: video! });
        }

        await fetch(`/api/products/${productId}/vision-profile`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frameCount: result.frame_count,
            embeddingModel: result.embedding_model,
            profileStatus: result.profile_status,
          }),
        });
      }

      stopCamera();
      router.refresh();
    } catch {
      setError("Network error. Make sure the server and Vision Module are running.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Add product</CardTitle>
          <CardDescription>Fill details, record a short video, then save once.</CardDescription>
        </div>
      </CardHeader>

      <div className="grid gap-4">
        {error && (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
        )}

        <div>
          <label className="mb-2 block text-sm font-bold text-[#060b1f]">Product name</label>
          <Input name="name" placeholder="Coke 500ml" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-[#060b1f]">SKU</label>
          <Input name="sku" placeholder="COKE-500" value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-[#060b1f]">Barcode (UPC / EAN)</label>
          <Input name="barcode" placeholder="8901234567890" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-[#060b1f]">Category</label>
          <Input name="categoryName" placeholder="Drinks" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Price</label>
            <Input name="price" type="number" min="1" step="0.01" placeholder="120" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Stock</label>
            <Input name="initialQuantity" type="number" min="0" step="1" value={initialQuantity} onChange={(e) => setInitialQuantity(e.target.value)} required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Low alert</label>
            <Input name="reorderLevel" type="number" min="0" step="1" value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} required />
          </div>
        </div>

        <hr className="border-[#dfebf3]" />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setTab("record"); stopCamera(); setCapturedFrames([]); }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "record" ? "bg-[#060b1f] text-white" : "bg-[#f1f7fb] text-[#607080] hover:bg-[#dfebf3]"
            }`}
          >
            <Camera className="mr-1 inline h-4 w-4" /> Record video
          </button>
          <button
            type="button"
            onClick={() => { setTab("upload"); stopCamera(); setCapturedFrames([]); }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "upload" ? "bg-[#060b1f] text-white" : "bg-[#f1f7fb] text-[#607080] hover:bg-[#dfebf3]"
            }`}
          >
            <Upload className="mr-1 inline h-4 w-4" /> Upload video
          </button>
        </div>

        {tab === "upload" ? (
          <div>
            <label className="mb-2 block text-sm font-bold text-[#060b1f]">Upload packaging video</label>
            <input
              type="file"
              accept="video/*"
              onChange={(event) => setVideo(event.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-[#dfebf3] bg-white px-4 py-3 text-sm text-[#607080]"
            />
            {video && (
              <div className="mt-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                {video.name} selected ({(video.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video ref={cameraRef} autoPlay muted playsInline className="h-64 w-full object-cover" />
              {isRecording && (
                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  REC
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <video ref={extractorRef} className="hidden" muted playsInline />

            {cameraState === "loading" && (
              <div className="flex items-center gap-2 rounded-2xl bg-[#eef2ff] px-4 py-3 text-sm font-medium text-[#4f46e5]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Starting camera...
              </div>
            )}
            {cameraState === "denied" && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Camera permission denied. Allow camera access in your browser settings, or use the upload tab.
              </div>
            )}
            {cameraState === "error" && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Could not access camera. Use the upload tab instead.
              </div>
            )}

            {!isRecording && !isExtracting && cameraState === "ready" && capturedFrames.length === 0 && (
              <div className="rounded-2xl bg-[#f1f7fb] px-4 py-3 text-sm leading-6 text-[#607080]">
                <Camera className="mr-2 inline h-4 w-4" />
                Record 3-5 seconds slowly moving the product in front of the camera. The video is split into frames automatically.
              </div>
            )}

            {!isRecording ? (
              <Button
                variant="primary"
                type="button"
                onClick={startRecording}
                disabled={cameraState !== "ready" || isExtracting}
              >
                {cameraState === "loading" ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting camera...</>
                ) : (
                  <><Videotape className="mr-2 h-4 w-4" /> Start recording</>
                )}
              </Button>
            ) : (
              <Button variant="danger" type="button" onClick={stopRecording}>
                <Square className="mr-2 h-4 w-4" /> Stop recording
              </Button>
            )}

            {isExtracting && (
              <div className="flex items-center gap-2 rounded-2xl bg-[#eef2ff] px-4 py-3 text-sm font-medium text-[#4f46e5]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Extracting frames from video...
              </div>
            )}

            {capturedFrames.length > 0 && !isExtracting && (
              <>
                <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                  {capturedFrames.length} frames extracted. Hover to remove blurry ones.
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {capturedFrames.map((frame, i) => (
                    <div key={i} className="group relative overflow-hidden rounded-lg">
                      <img src={frame.url} alt={`Frame ${i + 1}`} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFrame(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">{i + 1}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="rounded-2xl bg-[#f1f7fb] px-4 py-3 text-sm font-medium leading-6 text-[#607080]">
          <Camera className="mr-2 inline h-4 w-4" />
          {status}
        </div>

        <Button
          variant="gradient"
          type="button"
          onClick={saveAll}
          disabled={isSaving || isRecording || isExtracting}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save product & vision profile"}
        </Button>
      </div>
    </Card>
  );
}

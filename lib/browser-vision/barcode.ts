import type { BrowserMultiFormatReader } from "@zxing/browser";

let nativeDetector: BarcodeDetector | null | undefined = undefined;
let zxingReader: BrowserMultiFormatReader | null | undefined = undefined;
let zxingCanvas: HTMLCanvasElement | null = null;

function getNativeDetector(): BarcodeDetector | null {
  if (nativeDetector !== undefined) return nativeDetector;
  if (typeof BarcodeDetector !== "undefined") {
    try {
      nativeDetector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      });
    } catch {
      nativeDetector = null;
    }
  } else {
    nativeDetector = null;
  }
  return nativeDetector;
}

async function getZxingReader(): Promise<BrowserMultiFormatReader | null> {
  if (zxingReader !== undefined) return zxingReader;
  if (typeof window === "undefined") { zxingReader = null; return null; }
  try {
    const mod = await import("@zxing/browser");
    zxingReader = new mod.BrowserMultiFormatReader();
    return zxingReader;
  } catch {
    zxingReader = null;
    return null;
  }
}

export function isBarcodeSupported(): boolean {
  return true;
}

export function hasNativeBarcodeDetector(): boolean {
  return getNativeDetector() !== null;
}

export async function detectBarcode(
  video: HTMLVideoElement,
  options: { fallback?: boolean; maxSize?: number } = {},
): Promise<string | null> {
  const fallback = options.fallback ?? true;
  const maxSize = options.maxSize ?? 420;
  const native = getNativeDetector();
  if (native) {
    try {
      const barcodes = await native.detect(video);
      if (barcodes.length > 0) return barcodes[0].rawValue;
    } catch {
      // native failed, fall through
    }
  }
  return fallback ? detectWithZxing(video, maxSize) : null;
}

async function detectWithZxing(video: HTMLVideoElement, maxSize: number): Promise<string | null> {
  const reader = await getZxingReader();
  if (!reader) return null;
  try {
    zxingCanvas ||= document.createElement("canvas");
    const canvas = zxingCanvas;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    const scale = Math.min(maxSize / w, maxSize / h, 1);
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const result = reader.decodeFromCanvas(canvas);
    return result.getText();
  } catch {
    return null;
  }
}

export async function detectBarcodeFromCanvas(canvas: HTMLCanvasElement): Promise<string | null> {
  const native = getNativeDetector();
  if (native) {
    try {
      const barcodes = await native.detect(canvas);
      if (barcodes.length > 0) return barcodes[0].rawValue;
    } catch {}
  }
  const reader = await getZxingReader();
  if (!reader) return null;
  try {
    const result = reader.decodeFromCanvas(canvas);
    return result.getText();
  } catch {
    return null;
  }
}

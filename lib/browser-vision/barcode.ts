import type { BrowserMultiFormatReader } from "@zxing/browser";

let nativeDetector: BarcodeDetector | null | undefined = undefined;
let zxingReader: BrowserMultiFormatReader | null | undefined = undefined;
let zxingCanvas: HTMLCanvasElement | null = null;
let processedCanvas: HTMLCanvasElement | null = null;

type BarcodeDetectOptions = {
  fallback?: boolean;
  maxSize?: number;
  tryHarder?: boolean;
};

type CropAttempt = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  upscale: number;
};

const robustCropAttempts: CropAttempt[] = [
  { sx: 0, sy: 0, sw: 1, sh: 1, upscale: 1 },
  { sx: 0.04, sy: 0.27, sw: 0.92, sh: 0.46, upscale: 2.2 },
  { sx: 0.14, sy: 0.14, sw: 0.72, sh: 0.72, upscale: 2.2 },
  { sx: 0.22, sy: 0.32, sw: 0.56, sh: 0.36, upscale: 3 },
];

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
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import("@zxing/browser"),
      import("@zxing/library"),
    ]);
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.CODABAR,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
    ]);
    zxingReader = new BrowserMultiFormatReader(hints);
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
  options: BarcodeDetectOptions = {},
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
  if (!fallback) return null;
  return options.tryHarder ? detectVideoTryHarder(video, maxSize) : detectWithZxing(video, maxSize);
}

async function detectWithZxing(video: HTMLVideoElement, maxSize: number): Promise<string | null> {
  try {
    return decodeWithZxing(drawVideoCrop(video, { sx: 0, sy: 0, sw: 1, sh: 1, upscale: 1 }, maxSize, false));
  } catch {
    return null;
  }
}

async function detectVideoTryHarder(video: HTMLVideoElement, maxSize: number): Promise<string | null> {
  for (const crop of robustCropAttempts) {
    const canvas = drawVideoCrop(video, crop, maxSize, true);
    const decoded = await decodeCanvasVariants(canvas);
    if (decoded) return decoded;
  }
  return null;
}

function drawVideoCrop(video: HTMLVideoElement, crop: CropAttempt, maxSize: number, allowUpscale: boolean): HTMLCanvasElement {
  zxingCanvas ||= document.createElement("canvas");
  const canvas = zxingCanvas;
  const sourceW = video.videoWidth || 640;
  const sourceH = video.videoHeight || 480;
  const sx = sourceW * crop.sx;
  const sy = sourceH * crop.sy;
  const sw = sourceW * crop.sw;
  const sh = sourceH * crop.sh;
  const scaleLimit = allowUpscale ? crop.upscale : 1;
  const scale = Math.min(maxSize / sw, maxSize / sh, scaleLimit);
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = scale <= 1;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function decodeCanvasVariants(canvas: HTMLCanvasElement): Promise<string | null> {
  const original = await detectBarcodeFromCanvas(canvas);
  if (original) return original;

  const contrast = prepareCanvasForBarcode(canvas, "contrast");
  const contrastResult = await detectBarcodeFromCanvas(contrast);
  if (contrastResult) return contrastResult;

  return detectBarcodeFromCanvas(prepareCanvasForBarcode(canvas, "binary"));
}

function prepareCanvasForBarcode(canvas: HTMLCanvasElement, mode: "contrast" | "binary"): HTMLCanvasElement {
  processedCanvas ||= document.createElement("canvas");
  const output = processedCanvas;
  output.width = canvas.width;
  output.height = canvas.height;
  const ctx = output.getContext("2d")!;
  ctx.filter = mode === "contrast" ? "grayscale(1) contrast(1.9) brightness(1.08)" : "grayscale(1) contrast(1.55)";
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";

  if (mode === "binary") {
    const image = ctx.getImageData(0, 0, output.width, output.height);
    const threshold = getOtsuThreshold(image.data);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = image.data[i] > threshold ? 255 : 0;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }

  return output;
}

function getOtsuThreshold(data: Uint8ClampedArray): number {
  const histogram = new Array<number>(256).fill(0);
  let total = 0;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i];
    histogram[value]++;
    total++;
    sum += value;
  }

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = 0;
  let threshold = 128;
  for (let value = 0; value < 256; value++) {
    backgroundWeight += histogram[value];
    if (backgroundWeight === 0) continue;

    const foregroundWeight = total - backgroundWeight;
    if (foregroundWeight === 0) break;

    backgroundSum += value * histogram[value];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance = backgroundWeight * foregroundWeight * (backgroundMean - foregroundMean) ** 2;
    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = value;
    }
  }
  return threshold;
}

async function decodeWithZxing(canvas: HTMLCanvasElement): Promise<string | null> {
  const reader = await getZxingReader();
  if (!reader) return null;
  try {
    const result = reader.decodeFromCanvas(canvas);
    return result.getText();
  } catch {
    return null;
  }
}

export async function detectBarcodeFromCanvas(canvas: HTMLCanvasElement, options: { tryHarder?: boolean } = {}): Promise<string | null> {
  const native = getNativeDetector();
  if (native) {
    try {
      const barcodes = await native.detect(canvas);
      if (barcodes.length > 0) return barcodes[0].rawValue;
    } catch {}
  }
  const decoded = await decodeWithZxing(canvas);
  if (decoded || !options.tryHarder) return decoded;

  const contrast = await decodeWithZxing(prepareCanvasForBarcode(canvas, "contrast"));
  if (contrast) return contrast;

  return decodeWithZxing(prepareCanvasForBarcode(canvas, "binary"));
}

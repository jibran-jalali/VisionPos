let detector: BarcodeDetector | null = null;

export function isBarcodeSupported(): boolean {
  return "BarcodeDetector" in globalThis;
}

export function getDetector(): BarcodeDetector | null {
  if (detector) return detector;
  if (!isBarcodeSupported()) return null;
  try {
    detector = new BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
    });
    return detector;
  } catch {
    return null;
  }
}

export async function detectBarcode(video: HTMLVideoElement): Promise<string | null> {
  const d = getDetector();
  if (!d) return null;
  try {
    const barcodes = await d.detect(video);
    return barcodes.length > 0 ? barcodes[0].rawValue : null;
  } catch {
    return null;
  }
}

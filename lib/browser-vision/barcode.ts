export function isBarcodeSupported(): boolean {
  return "BarcodeDetector" in globalThis;
}

export async function detectBarcode(video: HTMLVideoElement): Promise<string | null> {
  if (!isBarcodeSupported()) return null;

  try {
    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"] });
    const barcodes = await detector.detect(video);
    return barcodes.length > 0 ? barcodes[0].rawValue : null;
  } catch {
    return null;
  }
}

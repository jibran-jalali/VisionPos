"use client";

export type ScannerDevice = {
  vendorId: number;
  productId: number;
  productName: string;
  serialNumber: string;
};

let activeDevice: any = null;
let onDataCallback: ((data: string) => void) | null = null;
let inputReportListener: ((event: any) => void) | null = null;

export async function connectScanner(): Promise<ScannerDevice | null> {
  if (activeDevice) return activeDevice;

  try {
    activeDevice = await (navigator as any).hid.requestDevice({
      filters: [
        { vendorId: 0x0c2e },
        { vendorId: 0x0596 },
        { vendorId: 0x0456 },
        { vendorId: 0x04b8 },
        { vendorId: 0x0a5f },
        { vendorId: 0x0525 },
        { vendorId: 0x2190 },
        { vendorId: 0x0483 },
        { vendorId: 0x0493 },
      ],
    });

    if (!activeDevice) return null;

    await activeDevice.open();

    const devInfo: ScannerDevice = {
      vendorId: activeDevice.vendorId,
      productId: activeDevice.productId,
      productName: activeDevice.productName || `Scanner ${activeDevice.vendorId}`,
      serialNumber: activeDevice.serialNumber || "",
    };

    inputReportListener = (event: any) => {
      const data = new Uint8Array(event.data);
      const text = new TextDecoder("utf-8", { fatal: false })
        .decode(data)
        .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
        .trim();
      if (text && onDataCallback) onDataCallback(text);
    };

    activeDevice.addEventListener("inputreport", inputReportListener);

    return devInfo;
  } catch {
    activeDevice = null;
    return null;
  }
}

export function disconnectScanner() {
  if (activeDevice) {
    if (inputReportListener) {
      activeDevice.removeEventListener("inputreport", inputReportListener);
      inputReportListener = null;
    }
    activeDevice.close().catch(() => {});
    activeDevice = null;
  }
  onDataCallback = null;
}

export function isScannerConnected(): boolean {
  return !!activeDevice?.opened;
}

export function onScannerData(callback: (data: string) => void) {
  onDataCallback = callback;
}

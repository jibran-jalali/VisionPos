"use client";

let device: any = null;

const VENDOR_IDS = [0x0456, 0x04b8, 0x0525, 0x1fc9, 0x0483, 0x28e9, 0x0fe6, 0x4348, 0x1a86, 0x067b, 0x23d2, 0x0493];
const PRINTER_CLASS = 0x07;

export async function connectPrinter(): Promise<boolean> {
  if (device?.opened) return true;

  try {
    device = await (navigator as any).usb?.requestDevice({
      filters: [
        ...VENDOR_IDS.map((vid: number) => ({ vendorId: vid })),
        { classCode: PRINTER_CLASS },
      ],
    });
    if (!device) return false;
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    const interfaces: any[] = device.configuration?.interfaces || [];
    const iface: any = interfaces.find(
      (i: any) => i.alternate.interfaceClass === PRINTER_CLASS || i.alternate.interfaceClass === 0xFF
    );
    if (iface) {
      await device.claimInterface(iface.interfaceNumber);
      const outEps: any[] = (iface.alternate.endpoints || []).filter((e: any) => e.direction === "out");
      if (outEps.length > 0) {
        await device.selectAlternateInterface(iface.interfaceNumber, iface.alternate.alternateSetting);
      }
    }
    return true;
  } catch {
    device = null;
    return false;
  }
}

export function disconnectPrinter() {
  if (device?.opened) {
    device.close().catch(() => {});
  }
  device = null;
}

export function isPrinterConnected(): boolean {
  return !!device?.opened;
}

async function send(data: Uint8Array) {
  if (!device?.opened) throw new Error("Printer not connected");
  const ifaces: any[] = device.configuration?.interfaces || [];
  const firstIface: any = ifaces[0];
  const outEps: any[] = (firstIface?.alternate?.endpoints || []).filter((e: any) => e.direction === "out");
  const epNum: number = outEps[0]?.endpointNumber ?? 1;
  await device.transferOut(epNum, data);
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function feedLines(n: number): Uint8Array {
  return new Uint8Array([0x1b, 0x64, n]);
}

function cutPaper(): Uint8Array {
  return new Uint8Array([0x1d, 0x56, 0x00]);
}

function initPrinter(): Uint8Array {
  return new Uint8Array([0x1b, 0x40]);
}

function bold(on: boolean): Uint8Array {
  return new Uint8Array([0x1b, 0x45, on ? 1 : 0]);
}

function align(mode: number): Uint8Array {
  return new Uint8Array([0x1b, 0x61, mode]);
}

function doubleHeight(on: boolean): Uint8Array {
  return new Uint8Array([0x1b, 0x21, on ? 0x10 : 0x00]);
}

function underline(on: boolean): Uint8Array {
  return new Uint8Array([0x1b, 0x2d, on ? 1 : 0]);
}

export type ReceiptLine =
  | { type: "text"; value: string; align?: number; bold?: boolean; doubleHeight?: boolean; underline?: boolean }
  | { type: "divider" }
  | { type: "gap"; lines?: number }
  | { type: "barcode"; value: string }
  | { type: "qr"; value: string };

export async function printReceipt(lines: ReceiptLine[]): Promise<void> {
  if (!device?.opened) throw new Error("Printer not connected");

  const buf: number[] = [];
  const push = (...bytes: Uint8Array[]) => { for (const arr of bytes) for (const b of arr) buf.push(b); };

  push(initPrinter());

  for (const line of lines) {
    switch (line.type) {
      case "text":
        if (line.align !== undefined) push(align(line.align));
        if (line.bold) push(bold(true));
        if (line.doubleHeight) push(doubleHeight(true));
        if (line.underline) push(underline(true));
        push(textToBytes(line.value + "\n"));
        if (line.bold) push(bold(false));
        if (line.doubleHeight) push(doubleHeight(false));
        if (line.underline) push(underline(false));
        if (line.align !== undefined) push(align(0));
        break;
      case "divider":
        push(textToBytes("─".repeat(32) + "\n"));
        break;
      case "gap":
        push(feedLines(line.lines ?? 2));
        break;
      case "barcode":
        push(new Uint8Array([0x1d, 0x6b, 0x49, line.value.length]));
        push(textToBytes(line.value));
        push(feedLines(2));
        break;
      case "qr":
        push(new Uint8Array([0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x30, 0x00]));
        push(new Uint8Array([0x1d, 0x28, 0x6b, (line.value.length + 3) & 0xFF, ((line.value.length + 3) >> 8) & 0xFF, 0x31, 0x50, 0x30]));
        push(textToBytes(line.value));
        push(new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]));
        push(feedLines(2));
        break;
    }
  }

  push(feedLines(3));
  push(cutPaper());

  await send(new Uint8Array(buf));
}

"use client";

import { type ReceiptLine } from "@/lib/escpos-printer";

function padRight(str: string, len: number): string {
  return str.length >= len ? str.slice(0, len) : str + " ".repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
  return str.length >= len ? str : " ".repeat(len - str.length) + str;
}

function padCenter(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  const left = Math.floor((len - str.length) / 2);
  return " ".repeat(left) + str + " ".repeat(len - str.length - left);
}

export function buildReceiptLines(data: {
  businessName: string;
  storeName: string;
  storeAddress?: string;
  invoiceNumber: string;
  createdAt: Date | string;
  cashierName: string;
  paymentMethod: string;
  currencySymbol: string;
  items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountTendered?: number;
  changeDue?: number;
  footer?: string;
  invoiceId: string;
}): ReceiptLine[] {
  const W = 32;
  const date = new Date(data.createdAt);
  const dateStr = date.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "2-digit" });
  const timeStr = date.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" });
  const fmt = (n: number) => `${data.currencySymbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lines: ReceiptLine[] = [];

  lines.push({ type: "text", value: padCenter(data.businessName, W), align: 1, bold: true, doubleHeight: true });
  if (data.storeName) lines.push({ type: "text", value: padCenter(data.storeName, W), align: 1 });
  if (data.storeAddress) lines.push({ type: "text", value: padCenter(data.storeAddress, W), align: 1 });
  lines.push({ type: "divider" });
  lines.push({ type: "text", value: `Invoice: ${data.invoiceNumber}`, bold: true });
  lines.push({ type: "text", value: `${dateStr}  ${timeStr}` });
  lines.push({ type: "text", value: `Cashier: ${data.cashierName}` });
  lines.push({ type: "text", value: `Payment: ${data.paymentMethod.replace("_", " ")}` });
  lines.push({ type: "divider" });

  for (const item of data.items) {
    const qtyLine = `${item.quantity}x ${item.name}`;
    lines.push({ type: "text", value: padRight(qtyLine, W - 10) + padLeft(fmt(item.lineTotal), 10) });
    lines.push({ type: "text", value: `  @ ${fmt(item.unitPrice)} each` });
  }

  lines.push({ type: "divider" });
  lines.push({ type: "text", value: padRight("Subtotal", W - 10) + padLeft(fmt(data.subtotal), 10) });
  if (data.discountAmount > 0) lines.push({ type: "text", value: padRight("Discount", W - 10) + padLeft(`-${fmt(data.discountAmount)}`, 10) });
  if (data.taxAmount > 0) lines.push({ type: "text", value: padRight("Tax", W - 10) + padLeft(fmt(data.taxAmount), 10) });
  lines.push({ type: "text", value: padRight("TOTAL", W - 10) + padLeft(fmt(data.totalAmount), 10), bold: true, underline: true });
  if (data.paymentMethod === "CASH" && data.amountTendered !== undefined) {
    lines.push({ type: "text", value: padRight("Cash", W - 10) + padLeft(fmt(data.amountTendered), 10) });
    lines.push({ type: "text", value: padRight("Change", W - 10) + padLeft(fmt(data.changeDue || 0), 10), bold: true });
  }
  lines.push({ type: "divider" });
  lines.push({ type: "text", value: padCenter(data.footer || "Thank you for shopping with us!", W), align: 1 });
  lines.push({ type: "qr", value: `https://visionpos.app/invoice/${data.invoiceId}` });

  return lines;
}

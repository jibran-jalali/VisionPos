"use client";

import { Printer } from "lucide-react";

export function PrintButton({ invoiceId, format }: { invoiceId: string; format?: string }) {
  function handlePrint() {
    const url = format === "A4" ? `/invoices/${invoiceId}/a4` : `/invoices/${invoiceId}/receipt`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-[#060b1f] ring-1 ring-[#dfebf3] transition hover:bg-[#f1f7fb]">
      <Printer className="h-4 w-4" /> Print
    </button>
  );
}

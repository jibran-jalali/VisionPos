"use client";

import { ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReceiptTemplate } from "@/components/invoices/receipt-template";
import type { InvoicePrintData } from "@/lib/invoice-data";

export function InvoicePopup({
  invoiceData,
  onNext,
}: {
  invoiceData: InvoicePrintData;
  onNext: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#060b1f]/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[32px] border border-[#dfebf3] bg-[#f8fbff] shadow-[0_32px_90px_rgba(6,11,31,0.28)]">
        <div className="flex items-center justify-between border-b border-[#dfebf3] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#060b1f]">Transaction Complete</h2>
          <span className="text-xs font-bold text-emerald-600">{invoiceData.invoiceNumber}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <ReceiptTemplate invoice={invoiceData} />
        </div>
        <div className="flex gap-3 border-t border-[#dfebf3] px-6 py-4">
          <Button variant="primary" className="flex-1" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="gradient" className="flex-1" onClick={onNext}>
            Next Customer <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

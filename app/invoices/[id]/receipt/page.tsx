import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/invoices/print-button";
import { ReceiptTemplate } from "@/components/invoices/receipt-template";

export default function ReceiptPage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="no-print mx-auto mb-6 flex max-w-sm justify-end">
        <PrintButton />
      </div>
      <ReceiptTemplate />
    </main>
  );
}

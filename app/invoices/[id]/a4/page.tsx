import { A4Template } from "@/components/invoices/a4-template";
import { PrintButton } from "@/components/invoices/print-button";

export default function A4InvoicePage() {
  return (
    <main className="min-h-screen px-4 py-8">
      <div className="no-print mx-auto mb-6 flex max-w-4xl justify-end">
        <PrintButton />
      </div>
      <A4Template />
    </main>
  );
}

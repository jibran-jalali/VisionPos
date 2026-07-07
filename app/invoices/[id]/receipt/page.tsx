import { redirect } from "next/navigation";
import { PrintButton } from "@/components/invoices/print-button";
import { ReceiptTemplate } from "@/components/invoices/receipt-template";
import { auth } from "@/lib/auth";
import { getInvoicePrintData } from "@/lib/invoice-data";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.businessId) redirect("/login");
  const { id } = await params;
  const invoice = await getInvoicePrintData(id, session.user.businessId);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="no-print mx-auto mb-6 flex max-w-sm justify-end">
        <PrintButton />
      </div>
      <ReceiptTemplate invoice={invoice} />
    </main>
  );
}

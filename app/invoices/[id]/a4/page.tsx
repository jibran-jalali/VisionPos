import { redirect } from "next/navigation";
import { A4Template } from "@/components/invoices/a4-template";
import { PrintButton } from "@/components/invoices/print-button";
import { auth } from "@/lib/auth";
import { getInvoicePrintData } from "@/lib/invoice-data";

export default async function A4InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.businessId) redirect("/login");
  const { id } = await params;
  const invoice = await getInvoicePrintData(id, session.user.businessId);

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="no-print mx-auto mb-6 flex max-w-4xl justify-end">
        <PrintButton />
      </div>
      <A4Template invoice={invoice} />
    </main>
  );
}

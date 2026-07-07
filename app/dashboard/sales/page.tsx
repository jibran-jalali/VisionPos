import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/pos/print-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SalesPage() {
  const session = await auth();

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const sales = await prisma.sale.findMany({
    where: { businessId: session.user.businessId },
    include: { cashier: true, items: true, invoice: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <DashboardShell title="Sales" eyebrow="Invoices and history">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Completed sales with print options.</CardDescription>
          </div>
          <Badge variant="green">Receipt + A4 ready</Badge>
        </CardHeader>
        {sales.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#dfebf3] p-10 text-center">
            <p className="text-lg font-semibold text-[#060b1f]">No sales yet</p>
            <p className="mt-2 text-sm text-[#607080]">Sales history starts after the first completed checkout.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div key={sale.id} className="flex flex-col gap-4 rounded-3xl border border-[#dfebf3] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-[#060b1f]">{sale.invoiceNumber}</p>
                  <p className="mt-1 text-sm text-[#607080]">{sale.items.length} items · {sale.cashier.name || sale.cashier.email}</p>
                  <p className="mt-0.5 text-xs text-[#607080]">{new Date(sale.createdAt).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex items-center gap-4">
                  <strong className="text-lg text-[#060b1f]">{sale.currencySymbol} {Number(sale.totalAmount).toLocaleString()}</strong>
                  {sale.invoice && (
                    <div className="flex gap-2">
                      <PrintButton invoiceId={sale.invoice.id} format="RECEIPT" />
                      <PrintButton invoiceId={sale.invoice.id} format="A4" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}

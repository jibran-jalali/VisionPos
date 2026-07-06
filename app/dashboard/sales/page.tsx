import { Printer } from "lucide-react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SalesPage() {
  const session = await auth();

  if (!session?.user?.businessId) {
    redirect("/login");
  }

  const sales = await prisma.sale.findMany({
    where: { businessId: session.user.businessId },
    include: { cashier: true, items: true },
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <DashboardShell title="Sales" eyebrow="Invoices and history">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>Completed sales will appear here after real checkout transactions.</CardDescription>
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
                </div>
                <div className="flex items-center gap-4">
                  <strong className="text-lg text-[#060b1f]">{sale.currencySymbol} {Number(sale.totalAmount).toLocaleString()}</strong>
                  <Button variant="soft"><Printer className="mr-2 h-4 w-4" /> Print</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardShell>
  );
}
